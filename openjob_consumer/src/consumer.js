require('dotenv').config();
const amqplib = require('amqplib');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const QUEUE = 'application:created';

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

async function startConsumer() {
  const connection = await amqplib.connect({
    hostname: process.env.RABBITMQ_HOST || 'localhost',
    port: process.env.RABBITMQ_PORT || 5672,
    username: process.env.RABBITMQ_USER || 'guest',
    password: process.env.RABBITMQ_PASSWORD || 'guest',
  });

  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  console.log('OpenJob Consumer is running and waiting for messages...');

  channel.consume(QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        const { application_id } = JSON.parse(msg.content.toString());
        console.log(`Processing application: ${application_id}`);

        const result = await pool.query(`
          SELECT 
            a.id AS application_id,
            a.created_at,
            u.name AS applicant_name,
            u.email AS applicant_email,
            j.title AS job_title,
            j.company_id,
            c.name AS company_name
          FROM applications a
          JOIN users u ON a.user_id = u.id
          JOIN jobs j ON a.job_id = j.id
          JOIN companies c ON j.company_id = c.id
          WHERE a.id = $1
        `, [application_id]);

        if (result.rows.length > 0) {
          const data = result.rows[0];

          await transporter.sendMail({
            from: `"OpenJob Platform" <${process.env.MAIL_USER}>`,
            to: process.env.MAIL_USER, // Set to process.env.MAIL_USER for testing/development
            subject: `New Application for ${data.job_title}`,
            html: `
              <h2>New Job Application Received</h2>
              <p><strong>Applicant Email:</strong> ${data.applicant_email}</p>
              <p><strong>Applicant Name:</strong> ${data.applicant_name}</p>
              <p><strong>Application Date:</strong> ${data.created_at}</p>
              <p><strong>Position:</strong> ${data.job_title}</p>
              <p><strong>Company:</strong> ${data.company_name}</p>
            `,
          });

          console.log(`Email notification sent for application ${application_id}`);
        }

        channel.ack(msg);
      } catch (error) {
        console.error('Consumer error:', error.message);
        channel.nack(msg, false, true);
      }
    }
  });
}

startConsumer().catch(console.error);
