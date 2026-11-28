const { DEFAULT_WEIGHTS, DIMENSION_NAMES } = require('../constants');

const dimensions = [
  {
    code: 'P',
    name: DIMENSION_NAMES.P,
    description: 'Perceptual accessibility: whether banking information can be received through non-visual channels.',
    weight: DEFAULT_WEIGHTS.P
  },
  {
    code: 'O',
    name: DIMENSION_NAMES.O,
    description: 'Operational accessibility: whether banking tasks can be completed using accessible interactions.',
    weight: DEFAULT_WEIGHTS.O
  },
  {
    code: 'C',
    name: DIMENSION_NAMES.C,
    description: 'Cognitive accessibility: whether information, instructions and recovery paths are easy to understand.',
    weight: DEFAULT_WEIGHTS.C
  },
  {
    code: 'S',
    name: DIMENSION_NAMES.S,
    description: 'Security accessibility: whether protective controls remain usable without vision.',
    weight: DEFAULT_WEIGHTS.S
  },
  {
    code: 'A',
    name: DIMENSION_NAMES.A,
    description: 'Assistive technology integration: how well the app works with screen readers and device accessibility services.',
    weight: DEFAULT_WEIGHTS.A
  }
];

const criteria = [
  {
    code: 'P01',
    dimensionCode: 'P',
    name: 'Meaningful accessible labels on interactive controls',
    description: 'Every interactive control exposes a concise, meaningful accessible label.',
    assessmentInstructions: 'Inspect each control with a screen reader and confirm the announced label identifies its purpose.',
    assessmentMethod: 'assistiveTechnologyTesting'
  },
  {
    code: 'P02',
    dimensionCode: 'P',
    name: 'Account balances communicated through accessible output',
    description: 'Balance information is available as structured text suitable for speech output.',
    assessmentInstructions: 'Retrieve a balance response and verify it contains an announcement string with the formatted amount and currency.',
    assessmentMethod: 'automated'
  },
  {
    code: 'P03',
    dimensionCode: 'P',
    name: 'Text resizing works correctly',
    description: 'Layout remains usable when text scale is increased through accessibility preferences.',
    assessmentInstructions: 'Set textScale to 2.0 and verify that content remains readable and controls are not clipped.',
    assessmentMethod: 'userTesting'
  },
  {
    code: 'P04',
    dimensionCode: 'P',
    name: 'Sufficient contrast for important information',
    description: 'Important information satisfies the project contrast requirements in high-contrast mode.',
    assessmentInstructions: 'Enable highContrastEnabled and measure contrast ratios for balances, labels and status messages.',
    assessmentMethod: 'manual'
  },
  {
    code: 'P05',
    dimensionCode: 'P',
    name: 'Dynamic transaction updates are announced',
    description: 'State changes such as transfer review and completion produce structured announcements.',
    assessmentInstructions: 'Trigger transfer review and confirmation and verify accessibilityFeedback.announcement is present and accurate.',
    assessmentMethod: 'automated'
  },
  {
    code: 'O01',
    dimensionCode: 'O',
    name: 'Screen-reader navigation of controls',
    description: 'Users can reach and activate banking controls without visual interaction.',
    assessmentInstructions: 'Ask participants to complete a balance task using only TalkBack or VoiceOver gestures.',
    assessmentMethod: 'userTesting'
  },
  {
    code: 'O02',
    dimensionCode: 'O',
    name: 'Logical focus and reading order',
    description: 'Focus moves through controls in a predictable, task-consistent order.',
    assessmentInstructions: 'Traverse each screen with a screen reader and compare the reading order with the task flow.',
    assessmentMethod: 'assistiveTechnologyTesting'
  },
  {
    code: 'O03',
    dimensionCode: 'O',
    name: 'Forms completable without visual interaction',
    description: 'Registration, login and transfer forms can be completed using accessible input only.',
    assessmentInstructions: 'Observe participants completing each form with the screen reader and no visual cues.',
    assessmentMethod: 'userTesting'
  },
  {
    code: 'O04',
    dimensionCode: 'O',
    name: 'Clear accessible roles and states',
    description: 'Controls expose correct roles, selected states and disabled states.',
    assessmentInstructions: 'Inspect the accessibility tree of each control and verify role and state metadata.',
    assessmentMethod: 'assistiveTechnologyTesting'
  },
  {
    code: 'O05',
    dimensionCode: 'O',
    name: 'Consistent access to important banking functions',
    description: 'Balance, history and transfer functions are reachable consistently from every relevant screen.',
    assessmentInstructions: 'Map navigation paths to each core function and verify they are available from the expected locations.',
    assessmentMethod: 'manual'
  },
  {
    code: 'C01',
    dimensionCode: 'C',
    name: 'Understandable banking instructions',
    description: 'Instructions use plain language and avoid unexplained banking jargon.',
    assessmentInstructions: 'Review all instruction strings and ask participants to explain them back in their own words.',
    assessmentMethod: 'userTesting'
  },
  {
    code: 'C02',
    dimensionCode: 'C',
    name: 'Simple and predictable navigation',
    description: 'Navigation structure and labels remain consistent across screens.',
    assessmentInstructions: 'Compare navigation labels and ordering across screens and record inconsistencies.',
    assessmentMethod: 'manual'
  },
  {
    code: 'C03',
    dimensionCode: 'C',
    name: 'Transaction review before execution',
    description: 'Recipient, amount and narration are presented for review before any balance change.',
    assessmentInstructions: 'Call the transfer review endpoint and verify no balance change occurs and review fields are complete.',
    assessmentMethod: 'automated'
  },
  {
    code: 'C04',
    dimensionCode: 'C',
    name: 'Recovery-oriented error messages',
    description: 'Errors explain what happened and how the user can recover.',
    assessmentInstructions: 'Trigger validation and insufficient-funds errors and evaluate their explanation and recovery guidance.',
    assessmentMethod: 'manual'
  },
  {
    code: 'C05',
    dimensionCode: 'C',
    name: 'Explicit confirmation for irreversible actions',
    description: 'Transfers require a separate confirmation step after review.',
    assessmentInstructions: 'Verify that calling the review endpoint never changes balances and that confirmation is required for processing.',
    assessmentMethod: 'automated'
  },
  {
    code: 'S01',
    dimensionCode: 'S',
    name: 'Nonvisual login interaction',
    description: 'Login can be completed entirely with accessible interaction.',
    assessmentInstructions: 'Observe participants signing in using only screen-reader navigation.',
    assessmentMethod: 'userTesting'
  },
  {
    code: 'S02',
    dimensionCode: 'S',
    name: 'Accessible authentication inputs',
    description: 'Authentication fields expose labels, input types and error feedback accessibly.',
    assessmentInstructions: 'Inspect login fields and announced validation errors with a screen reader.',
    assessmentMethod: 'assistiveTechnologyTesting'
  },
  {
    code: 'S03',
    dimensionCode: 'S',
    name: 'Sensitive transaction details verifiable before execution',
    description: 'Users can review recipient and amount before confirming a transfer.',
    assessmentInstructions: 'Verify the review response includes recipient name, account number, amount and narration.',
    assessmentMethod: 'automated'
  },
  {
    code: 'S04',
    dimensionCode: 'S',
    name: 'Transaction confirmation required before processing',
    description: 'No debit or credit occurs before explicit confirmation.',
    assessmentInstructions: 'Compare account balances before review, after review and after confirmation.',
    assessmentMethod: 'automated'
  },
  {
    code: 'S05',
    dimensionCode: 'S',
    name: 'Privacy mode protects spoken information',
    description: 'Privacy preferences can suppress or reduce sensitive spoken details.',
    assessmentInstructions: 'Enable privacyMode and verify the client can apply reduced-detail announcements from the saved preferences.',
    assessmentMethod: 'manual'
  },
  {
    code: 'A01',
    dimensionCode: 'A',
    name: 'Compatibility with Android TalkBack',
    description: 'Controls and announcements work correctly with TalkBack.',
    assessmentInstructions: 'Run the core task set on an Android device with TalkBack enabled and record failures.',
    assessmentMethod: 'assistiveTechnologyTesting'
  },
  {
    code: 'A02',
    dimensionCode: 'A',
    name: 'Compatibility with iOS VoiceOver',
    description: 'Controls and announcements work correctly with VoiceOver.',
    assessmentInstructions: 'Run the core task set on an iOS device with VoiceOver enabled and record failures.',
    assessmentMethod: 'assistiveTechnologyTesting'
  },
  {
    code: 'A03',
    dimensionCode: 'A',
    name: 'Dynamic content announcements',
    description: 'State changes are announced without requiring the user to re-scan the screen.',
    assessmentInstructions: 'Trigger state changes and verify the accessibilityFeedback payload identifies announcement text and priority.',
    assessmentMethod: 'automated'
  },
  {
    code: 'A04',
    dimensionCode: 'A',
    name: 'Consistent screen-reader navigation across screens',
    description: 'Gestures and reading patterns behave consistently across the application.',
    assessmentInstructions: 'Compare navigation behaviour on login, balance, history and transfer screens.',
    assessmentMethod: 'userTesting'
  },
  {
    code: 'A05',
    dimensionCode: 'A',
    name: 'Exposed labels, roles and states',
    description: 'The accessibility tree exposes complete labels, roles and states for every control.',
    assessmentInstructions: 'Audit the accessibility tree on each screen and record missing or incorrect attributes.',
    assessmentMethod: 'assistiveTechnologyTesting'
  }
];

const tasks = [
  {
    taskCode: 'USER_LOGIN',
    taskName: 'User login',
    description: 'Sign in using an email address and password without visual assistance.'
  },
  {
    taskCode: 'VIEW_BALANCE',
    taskName: 'View account balance',
    description: 'Retrieve and understand the current account balance.'
  },
  {
    taskCode: 'VIEW_TRANSACTIONS',
    taskName: 'View transaction history',
    description: 'Open transaction history and identify a specific transaction.'
  },
  {
    taskCode: 'TRANSFER_FUNDS',
    taskName: 'Transfer funds',
    description: 'Review and complete a transfer to another demo account.'
  },
  {
    taskCode: 'REVIEW_CONFIRM_TRANSACTION',
    taskName: 'Review and confirm a transaction',
    description: 'Review transfer details and explicitly confirm or cancel the transaction.'
  },
  {
    taskCode: 'UPDATE_ACCESSIBILITY',
    taskName: 'Update accessibility preferences',
    description: 'Change and save an accessibility preference, then verify it was stored.'
  }
];

const demoUsers = [
  {
    email: 'demo.user1@accessflow.local',
    fullName: 'Demo User One',
    phoneNumber: '+2348010000001',
    role: 'user'
  },
  {
    email: 'demo.user2@accessflow.local',
    fullName: 'Demo User Two',
    phoneNumber: '+2348010000002',
    role: 'user'
  },
  {
    email: 'admin@accessflow.local',
    fullName: 'AccessFlow Administrator',
    phoneNumber: '+2348010000000',
    role: 'admin'
  }
];

module.exports = { dimensions, criteria, tasks, demoUsers };
