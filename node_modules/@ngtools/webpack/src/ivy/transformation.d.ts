import * as ts from 'typescript';
export declare function createAotTransformers(builder: ts.BuilderProgram, options: {
    emitClassMetadata?: boolean;
    emitNgModuleScope?: boolean;
}): ts.CustomTransformers;
export declare function createJitTransformers(builder: ts.BuilderProgram, options: {
    directTemplateLoading?: boolean;
}): ts.CustomTransformers;
export declare function mergeTransformers(first: ts.CustomTransformers, second: ts.CustomTransformers): ts.CustomTransformers;
export declare function replaceBootstrap(getTypeChecker: () => ts.TypeChecker): ts.TransformerFactory<ts.SourceFile>;
