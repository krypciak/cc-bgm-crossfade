export {}
declare global {
    namespace ig {
        interface BGM_TRACK_LIST {
            female: ig.BGM_TRACK_LIST.Config
            male: ig.BGM_TRACK_LIST.Config
        }
    }
}
// ig.BGM_TRACK_LIST.female = { path: 'media/bgm/female.mp3', volume: 1, loopEnd: 21 }
// ig.BGM_TRACK_LIST.male = { path: 'media/bgm/male.mp3', volume: 1, loopEnd: 21 }

ig.BGM_TRACK_LIST.female = { path: 'media/bgm/interface-hard.ogg', loopEnd: 116.36, volume: 1 }
ig.BGM_TRACK_LIST.male = { path: 'media/bgm/interface.ogg', loopEnd: 116.36, volume: 1 }

declare global {
    namespace ig {
        interface BGM_DEFAULT_TRACKS {
            myTrack: ig.BGM_DEFAULT_TRACKS.Config
        }
    }
}
ig.BGM_DEFAULT_TRACKS.myTrack = {
    field: { track: 'female', volume: 1 },
    battle: { track: 'male', volume: 1 },
    rankBattle: { track: 'male', volume: 1 },
    sRankBattle: { track: 's-rank', volume: 1 },
    fieldBattleCrossfade: {
        fadeTime: 2,
        fadeInSpline: t => Math.sqrt(t),
        fadeOutSpline: t => Math.sqrt(1 - t),
    },
}

/* make every map bgm myTrack */
ig.Bgm.inject({
    onStoragePreLoad(savefile) {
        savefile.bgm.defaultTrackSet = 'myTrack'
        this.parent!(savefile)
    },
    onStoragePostLoad(savefile) {
        savefile.bgm.defaultTrackSet = 'myTrack'
        this.parent!(savefile)
    },
    onLevelLoadStart(data) {
        data.attributes.bgm = 'myTrack'
        this.parent!(data)
    },
})
