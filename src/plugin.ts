import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import { Mod1 } from 'ccmodmanager/types/types'
import ccmod from '../ccmod.json'
import { injectBgmCrossover } from './bgm-crossover'

export default class BgmCrossover implements PluginClass {
    static dir: string
    static mod: Mod1
    static manifset: typeof import('../ccmod.json') = ccmod

    constructor(mod: Mod1) {
        BgmCrossover.dir = mod.baseDirectory
        BgmCrossover.mod = mod
        BgmCrossover.mod.isCCL3 = mod.findAllAssets ? true : false
        BgmCrossover.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')
    }

    async prestart() {
        injectBgmCrossover()
        // await import('./test')
    }
}
