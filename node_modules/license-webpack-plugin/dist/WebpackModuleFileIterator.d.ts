import { WebpackChunkModule } from './WebpackChunkModule';
declare class WebpackModuleFileIterator {
    iterateFiles(chunkModule: WebpackChunkModule, callback: (filename: string | null | undefined) => void): void;
    private internalCallback(callback, filename);
}
export { WebpackModuleFileIterator };
