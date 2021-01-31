/// <amd-module name="@angular/compiler-cli/src/ngtsc/perf/src/tracking" />
import * as ts from 'typescript';
import { DeclarationNode } from '../../reflection';
import { PerfRecorder } from './api';
export declare class PerfTracker implements PerfRecorder {
    private zeroTime;
    private nextSpanId;
    private log;
    readonly enabled = true;
    private constructor();
    static zeroedToNow(): PerfTracker;
    mark(name: string, node?: DeclarationNode, category?: string, detail?: string): void;
    start(name: string, node?: DeclarationNode, category?: string, detail?: string): number;
    stop(span: number): void;
    private makeLogMessage;
    asJson(): unknown;
    serializeToFile(target: string, host: ts.CompilerHost): void;
}
export interface PerfLogEvent {
    name?: string;
    span?: number;
    file?: string;
    declaration?: string;
    type: PerfLogEventType;
    category?: string;
    detail?: string;
    stamp: number;
}
export declare enum PerfLogEventType {
    SPAN_OPEN = 0,
    SPAN_CLOSE = 1,
    MARK = 2
}
