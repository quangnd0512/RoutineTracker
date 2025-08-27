import { logger, consoleTransport } from 'react-native-logs';

const log = logger.createLogger({
  transport: consoleTransport,
});

export default log;