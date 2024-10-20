import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/n_f_t_collection_v2.tact',
    options: {
        debug: true,
    },
};
