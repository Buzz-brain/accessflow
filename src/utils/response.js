const formatAmount = (amount) =>
  new Intl.NumberFormat('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(amount));

const formatNaira = (amount) => `${formatAmount(amount)} naira`;

const feedback = (type, announcement, extra = {}) => ({
  announce: true,
  type,
  announcement,
  ...extra
});

const successFeedback = (announcement, extra = {}) => feedback('success', announcement, extra);
const errorFeedback = (announcement, extra = {}) => feedback('error', announcement, extra);
const infoFeedback = (announcement, extra = {}) => feedback('info', announcement, extra);

const sendSuccess = (res, { status = 200, message, data, meta, accessibilityFeedback }) => {
  const body = { success: true, message };

  if (accessibilityFeedback) body.accessibilityFeedback = { announce: true, ...accessibilityFeedback };
  if (data !== undefined) body.data = data;
  if (meta !== undefined) body.meta = meta;

  return res.status(status).json(body);
};

const sendError = (res, { status = 500, message, code = 'ERROR', details = [], accessibilityFeedback }) => {
  const body = { success: false, message, code };

  if (details.length) body.details = details;
  if (accessibilityFeedback) body.accessibilityFeedback = { announce: true, ...accessibilityFeedback };

  return res.status(status).json(body);
};

module.exports = {
  formatAmount,
  formatNaira,
  feedback,
  successFeedback,
  errorFeedback,
  infoFeedback,
  sendSuccess,
  sendError
};
