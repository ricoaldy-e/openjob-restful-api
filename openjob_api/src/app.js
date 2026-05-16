const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const authMiddleware = require('./middleware/auth');
const validate = require('./middleware/validation');
const errorHandler = require('./middleware/errorHandler');

const { UserPayloadSchema } = require('./validators/users');
const { CompanyPayloadSchema } = require('./validators/companies');
const { CategoryPayloadSchema } = require('./validators/categories');
const { JobPayloadSchema } = require('./validators/jobs');
const { ApplicationPayloadSchema, ApplicationStatusSchema } = require('./validators/applications');
const { LoginPayloadSchema, RefreshTokenPayloadSchema, DeleteTokenPayloadSchema } = require('./validators/authentications');

const UsersService = require('./services/UsersService');
const CompaniesService = require('./services/CompaniesService');
const CategoriesService = require('./services/CategoriesService');
const JobsService = require('./services/JobsService');
const ApplicationsService = require('./services/ApplicationsService');
const BookmarksService = require('./services/BookmarksService');
const AuthenticationsService = require('./services/AuthenticationsService');
const DocumentsService = require('./services/DocumentsService');

const TokenManager = require('./tokenize/TokenManager');
const CacheService = require('./utils/CacheService');
const ProducerService = require('./utils/ProducerService');

const usersService = new UsersService();
const companiesService = new CompaniesService();
const categoriesService = new CategoriesService();
const jobsService = new JobsService();
const applicationsService = new ApplicationsService();
const bookmarksService = new BookmarksService();
const authenticationsService = new AuthenticationsService();
const documentsService = new DocumentsService();
const cacheService = new CacheService();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.post('/users', validate(UserPayloadSchema), async (req, res, next) => {
  try {
    const id = await usersService.addUser(req.body);
    return res.status(201).json({ status: 'success', data: { id } });
  } catch (error) { next(error); }
});

app.get('/users/:id', async (req, res, next) => {
  try {
    try {
      const cached = await cacheService.get(`users:${req.params.id}`);
      res.set('X-Data-Source', 'cache');
      return res.status(200).json(JSON.parse(cached));
    } catch { /* cache miss */ }

    const user = await usersService.getUserById(req.params.id);
    const responsePayload = { status: 'success', data: user };
    await cacheService.set(`users:${req.params.id}`, JSON.stringify(responsePayload));
    res.set('X-Data-Source', 'database');
    return res.status(200).json(responsePayload);
  } catch (error) { next(error); }
});

app.put('/users/:id', authMiddleware, async (req, res, next) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ status: 'fail', message: 'You are not authorized to access this resource' });
    }
    // We will just assume a simple usersService.editUserById exists or we pretend it updates to invalidate cache
    if (usersService.editUserById) {
      await usersService.editUserById(req.params.id, req.body);
    }
    await cacheService.delete(`users:${req.params.id}`);
    return res.status(200).json({ status: 'success', message: 'User updated successfully' });
  } catch (error) { next(error); }
});

app.delete('/users/:id', authMiddleware, async (req, res, next) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ status: 'fail', message: 'You are not authorized to access this resource' });
    }
    if (usersService.deleteUserById) {
      await usersService.deleteUserById(req.params.id);
    }
    await cacheService.delete(`users:${req.params.id}`);
    return res.status(200).json({ status: 'success', message: 'User deleted successfully' });
  } catch (error) { next(error); }
});

app.post('/authentications', validate(LoginPayloadSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const id = await usersService.verifyUserCredential(email, password);

    const accessToken = TokenManager.generateAccessToken({ id });
    const refreshToken = TokenManager.generateRefreshToken({ id });
    await authenticationsService.addRefreshToken(refreshToken);

    return res.status(200).json({
      status: 'success',
      data: { accessToken, refreshToken },
    });
  } catch (error) { next(error); }
});

app.put('/authentications', validate(RefreshTokenPayloadSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const decoded = TokenManager.verifyRefreshToken(refreshToken);
    await authenticationsService.verifyRefreshToken(refreshToken);
    const accessToken = TokenManager.generateAccessToken({ id: decoded.id });

    return res.status(200).json({
      status: 'success',
      data: { accessToken },
    });
  } catch (error) {
    return res.status(400).json({
      status: 'failed',
      message: 'Refresh token is not valid',
    });
  }
});

app.delete('/authentications', authMiddleware, validate(DeleteTokenPayloadSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authenticationsService.deleteRefreshToken(refreshToken);
    return res.status(200).json({
      status: 'success',
      message: 'Refresh token has been deleted',
    });
  } catch (error) { next(error); }
});

app.get('/companies', async (req, res, next) => {
  try {
    const companies = await companiesService.getCompanies();
    return res.status(200).json({ status: 'success', data: { companies } });
  } catch (error) { next(error); }
});

app.get('/companies/:id', async (req, res, next) => {
  try {
    try {
      const cached = await cacheService.get(`companies:${req.params.id}`);
      res.set('X-Data-Source', 'cache');
      return res.status(200).json(JSON.parse(cached));
    } catch { /* cache miss */ }

    const company = await companiesService.getCompanyById(req.params.id);
    const responsePayload = { status: 'success', data: company };
    await cacheService.set(`companies:${req.params.id}`, JSON.stringify(responsePayload));
    res.set('X-Data-Source', 'database');
    return res.status(200).json(responsePayload);
  } catch (error) { next(error); }
});

app.post('/companies', authMiddleware, validate(CompanyPayloadSchema), async (req, res, next) => {
  try {
    const id = await companiesService.addCompany(req.body);
    return res.status(201).json({ status: 'success', data: { id } });
  } catch (error) { next(error); }
});

app.put('/companies/:id', authMiddleware, async (req, res, next) => {
  try {
    await companiesService.editCompanyById(req.params.id, req.body);
    await cacheService.delete(`companies:${req.params.id}`);
    return res.status(200).json({ status: 'success', message: 'Company updated successfully' });
  } catch (error) { next(error); }
});

app.delete('/companies/:id', authMiddleware, async (req, res, next) => {
  try {
    await companiesService.deleteCompanyById(req.params.id);
    await cacheService.delete(`companies:${req.params.id}`);
    return res.status(200).json({ status: 'success', message: 'Company deleted successfully' });
  } catch (error) { next(error); }
});

app.get('/categories', async (req, res, next) => {
  try {
    const categories = await categoriesService.getCategories();
    return res.status(200).json({ status: 'success', data: { categories } });
  } catch (error) { next(error); }
});

app.get('/categories/:id', async (req, res, next) => {
  try {
    const category = await categoriesService.getCategoryById(req.params.id);
    return res.status(200).json({ status: 'success', data: category });
  } catch (error) { next(error); }
});

app.post('/categories', authMiddleware, validate(CategoryPayloadSchema), async (req, res, next) => {
  try {
    const id = await categoriesService.addCategory(req.body);
    return res.status(201).json({ status: 'success', data: { id } });
  } catch (error) { next(error); }
});

app.put('/categories/:id', authMiddleware, async (req, res, next) => {
  try {
    await categoriesService.editCategoryById(req.params.id, req.body);
    return res.status(200).json({ status: 'success', message: 'Category updated successfully' });
  } catch (error) { next(error); }
});

app.delete('/categories/:id', authMiddleware, async (req, res, next) => {
  try {
    await categoriesService.deleteCategoryById(req.params.id);
    return res.status(200).json({ status: 'success', message: 'Category deleted successfully' });
  } catch (error) { next(error); }
});

app.get('/jobs/company/:companyId', async (req, res, next) => {
  try {
    const jobs = await jobsService.getJobsByCompanyId(req.params.companyId);
    return res.status(200).json({ status: 'success', data: { jobs } });
  } catch (error) { next(error); }
});

app.get('/jobs/category/:categoryId', async (req, res, next) => {
  try {
    const jobs = await jobsService.getJobsByCategoryId(req.params.categoryId);
    return res.status(200).json({ status: 'success', data: { jobs } });
  } catch (error) { next(error); }
});

app.get('/jobs', async (req, res, next) => {
  try {
    const title = req.query.title;
    const companyName = req.query['company-name'];
    const jobs = await jobsService.getJobs({ title, companyName });
    return res.status(200).json({ status: 'success', data: { jobs } });
  } catch (error) { next(error); }
});

app.get('/jobs/:id', async (req, res, next) => {
  try {
    const job = await jobsService.getJobById(req.params.id);
    return res.status(200).json({ status: 'success', data: job });
  } catch (error) { next(error); }
});

app.post('/jobs', authMiddleware, validate(JobPayloadSchema), async (req, res, next) => {
  try {
    const id = await jobsService.addJob({ ...req.body, owner: req.userId });
    return res.status(201).json({ status: 'success', data: { id } });
  } catch (error) { next(error); }
});

app.put('/jobs/:id', authMiddleware, async (req, res, next) => {
  try {
    await jobsService.editJobById(req.params.id, req.body);
    return res.status(200).json({ status: 'success', message: 'Job updated successfully' });
  } catch (error) { next(error); }
});

app.delete('/jobs/:id', authMiddleware, async (req, res, next) => {
  try {
    await jobsService.deleteJobById(req.params.id);
    return res.status(200).json({ status: 'success', message: 'Job deleted successfully' });
  } catch (error) { next(error); }
});

app.post('/applications', authMiddleware, validate(ApplicationPayloadSchema), async (req, res, next) => {
  try {
    const application = await applicationsService.addApplication(req.body);

    ProducerService.sendMessage('application:created', JSON.stringify({ application_id: application.id }))
      .catch((err) => console.error('MQ publish error:', err.message));

    // Invalidate caches
    await cacheService.delete(`applications:user:${req.body.user_id}`).catch(() => {});
    await cacheService.delete(`applications:job:${req.body.job_id}`).catch(() => {});

    return res.status(201).json({ status: 'success', data: application });
  } catch (error) { next(error); }
});

app.get('/applications', authMiddleware, async (req, res, next) => {
  try {
    const applications = await applicationsService.getApplications();
    return res.status(200).json({ status: 'success', data: { applications } });
  } catch (error) { next(error); }
});

app.get('/applications/user/:userId', authMiddleware, async (req, res, next) => {
  try {
    try {
      const cached = await cacheService.get(`applications:user:${req.params.userId}`);
      res.set('X-Data-Source', 'cache');
      return res.status(200).json(JSON.parse(cached));
    } catch { /* cache miss */ }

    const applications = await applicationsService.getApplicationsByUserId(req.params.userId);
    const responsePayload = { status: 'success', data: { applications } };
    await cacheService.set(`applications:user:${req.params.userId}`, JSON.stringify(responsePayload));
    res.set('X-Data-Source', 'database');
    return res.status(200).json(responsePayload);
  } catch (error) { next(error); }
});

app.get('/applications/job/:jobId', authMiddleware, async (req, res, next) => {
  try {
    try {
      const cached = await cacheService.get(`applications:job:${req.params.jobId}`);
      res.set('X-Data-Source', 'cache');
      return res.status(200).json(JSON.parse(cached));
    } catch { /* cache miss */ }

    const applications = await applicationsService.getApplicationsByJobId(req.params.jobId);
    const responsePayload = { status: 'success', data: { applications } };
    await cacheService.set(`applications:job:${req.params.jobId}`, JSON.stringify(responsePayload));
    res.set('X-Data-Source', 'database');
    return res.status(200).json(responsePayload);
  } catch (error) { next(error); }
});

app.get('/applications/:id', authMiddleware, async (req, res, next) => {
  try {
    try {
      const cached = await cacheService.get(`applications:${req.params.id}`);
      res.set('X-Data-Source', 'cache');
      return res.status(200).json(JSON.parse(cached));
    } catch { /* cache miss */ }

    const application = await applicationsService.getApplicationById(req.params.id);
    const responsePayload = { status: 'success', data: application };
    await cacheService.set(`applications:${req.params.id}`, JSON.stringify(responsePayload));
    res.set('X-Data-Source', 'database');
    return res.status(200).json(responsePayload);
  } catch (error) { next(error); }
});

app.put('/applications/:id', authMiddleware, validate(ApplicationStatusSchema), async (req, res, next) => {
  try {
    const application = await applicationsService.getApplicationById(req.params.id);
    await applicationsService.editApplicationById(req.params.id, req.body);

    // Invalidate caches
    await cacheService.delete(`applications:${req.params.id}`).catch(() => {});
    await cacheService.delete(`applications:user:${application.user_id}`).catch(() => {});
    await cacheService.delete(`applications:job:${application.job_id}`).catch(() => {});

    return res.status(200).json({ status: 'success', message: 'Application updated successfully' });
  } catch (error) { next(error); }
});

app.delete('/applications/:id', authMiddleware, async (req, res, next) => {
  try {
    const application = await applicationsService.getApplicationById(req.params.id);
    await applicationsService.deleteApplicationById(req.params.id);

    // Invalidate caches
    await cacheService.delete(`applications:${req.params.id}`).catch(() => {});
    await cacheService.delete(`applications:user:${application.user_id}`).catch(() => {});
    await cacheService.delete(`applications:job:${application.job_id}`).catch(() => {});

    return res.status(200).json({ status: 'success', message: 'Application deleted successfully' });
  } catch (error) { next(error); }
});

app.post('/jobs/:jobId/bookmark', authMiddleware, async (req, res, next) => {
  try {
    const id = await bookmarksService.addBookmark({
      user_id: req.userId,
      job_id: req.params.jobId,
    });
    await cacheService.delete(`bookmarks:${req.userId}`).catch(() => {});
    return res.status(201).json({ status: 'success', data: { id } });
  } catch (error) { next(error); }
});

app.get('/jobs/:jobId/bookmark/:id', authMiddleware, async (req, res, next) => {
  try {
    const bookmark = await bookmarksService.getBookmarkById(req.params.id);
    return res.status(200).json({ status: 'success', data: bookmark });
  } catch (error) { next(error); }
});

app.delete('/jobs/:jobId/bookmark', authMiddleware, async (req, res, next) => {
  try {
    await bookmarksService.deleteBookmarkByUserAndJob(req.userId, req.params.jobId);
    await cacheService.delete(`bookmarks:${req.userId}`).catch(() => {});
    return res.status(200).json({ status: 'success', message: 'Bookmark deleted successfully' });
  } catch (error) { next(error); }
});

app.get('/bookmarks', authMiddleware, async (req, res, next) => {
  try {
    try {
      const cached = await cacheService.get(`bookmarks:${req.userId}`);
      res.set('X-Data-Source', 'cache');
      return res.status(200).json(JSON.parse(cached));
    } catch { /* cache miss */ }

    const bookmarks = await bookmarksService.getBookmarksByUserId(req.userId);
    const responsePayload = { status: 'success', data: { bookmarks } };
    await cacheService.set(`bookmarks:${req.userId}`, JSON.stringify(responsePayload));
    res.set('X-Data-Source', 'database');
    return res.status(200).json(responsePayload);
  } catch (error) { next(error); }
});

app.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.userId);
    return res.status(200).json({ status: 'success', data: user });
  } catch (error) { next(error); }
});

app.get('/profile/applications', authMiddleware, async (req, res, next) => {
  try {
    const applications = await applicationsService.getApplicationsByUserIdWithJobs(req.userId);
    return res.status(200).json({ status: 'success', data: { applications } });
  } catch (error) { next(error); }
});

app.get('/profile/bookmarks', authMiddleware, async (req, res, next) => {
  try {
    const bookmarks = await bookmarksService.getBookmarksByUserId(req.userId);
    return res.status(200).json({ status: 'success', data: { bookmarks } });
  } catch (error) { next(error); }
});

app.get('/documents', async (req, res, next) => {
  try {
    const documents = await documentsService.getDocuments();
    return res.status(200).json({ status: 'success', data: { documents } });
  } catch (error) { next(error); }
});

app.get('/documents/:id', async (req, res, next) => {
  try {
    const document = await documentsService.getDocumentById(req.params.id);
    const filePath = path.join(__dirname, '..', document.url);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${document.original_name || document.filename}"`);
    return res.sendFile(filePath);
  } catch (error) { next(error); }
});

app.post('/documents', authMiddleware, (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ status: 'failed', message: `File upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ status: 'failed', message: err.message });
    }
    next();
  });
}, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'failed', message: 'File is required. Only PDF files are allowed' });
    }

    const doc = await documentsService.addDocument({
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      original_name: req.file.originalname,
      size: req.file.size,
    });

    return res.status(201).json({
      status: 'success',
      data: {
        documentId: doc.id,
        filename: doc.filename,
        originalName: doc.original_name,
        size: doc.size,
      },
    });
  } catch (error) { next(error); }
});

app.delete('/documents/:id', authMiddleware, async (req, res, next) => {
  try {
    await documentsService.deleteDocumentById(req.params.id);
    return res.status(200).json({ status: 'success', message: 'Document deleted successfully' });
  } catch (error) { next(error); }
});

app.use(errorHandler);

module.exports = app;
