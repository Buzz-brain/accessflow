const authService = require('../services/auth.service');
const accessibilityService = require('../services/accessibility.service');
const { sendSuccess, infoFeedback } = require('../utils/response');

const register = async (req, res) => {
  const result = await authService.register(req.body);
  const preferences = await accessibilityService.getPreferences(result.user.id);

  return sendSuccess(res, {
    status: 201,
    message: 'Registration successful. Your AccessFlow account has been created.',
    data: { user: result.user, account: result.account, preferences },
    accessibilityFeedback: authService.registrationFeedback(req.body.fullName, result.account)
  });
};

const login = async (req, res) => {
  const result = await authService.login(req.body);

  return sendSuccess(res, {
    message: 'Login successful',
    data: { token: result.token, user: result.user, account: result.account },
    accessibilityFeedback: result.accessibilityFeedback
  });
};

const me = async (req, res) => {
  const result = await authService.getMe(req.user._id);

  return sendSuccess(res, {
    message: 'Current user retrieved',
    data: result,
    accessibilityFeedback: infoFeedback(`Signed in as ${result.user.fullName}.`)
  });
};

module.exports = { register, login, me };
