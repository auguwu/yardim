import { Configuration } from 'webpack';
import { WebpackConfigOptions } from '../../utils/build-options';
/**
 * Returns a partial Webpack configuration specific to creating a bundle for node
 * @param wco Options which include the build options and app config
 */
export declare function getServerConfig(wco: WebpackConfigOptions): Configuration;
