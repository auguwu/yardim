import { TaskExecutor } from '../../src';
import { TslintFixTaskOptions } from './options';
/** @deprecated since version 11. Use `ng lint --fix` directly instead. */
export default function (): TaskExecutor<TslintFixTaskOptions>;
