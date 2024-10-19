import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/zen_coin_master.tact',
    options: {
        debug: true,
    },
};
