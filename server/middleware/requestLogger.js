export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusEmoji = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';
    console.log(`${statusEmoji} [${new Date().toISOString().slice(11, 19)}] ${method.padEnd(6)} ${url} -> ${status} (${duration}ms)`);
  });

  next();
}
