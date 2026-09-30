import sharedConfig from './eslint-config/index.js';

export default [...sharedConfig({ ignores: ['node_modules/**', 'eslint-config/**'] })];
