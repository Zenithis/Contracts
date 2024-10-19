import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/n_f_t_item.tact',
    options: {
        debug: true,
    },
};
