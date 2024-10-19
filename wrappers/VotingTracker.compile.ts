import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/voting_tracker.tact',
    options: {
        debug: true,
    },
};
