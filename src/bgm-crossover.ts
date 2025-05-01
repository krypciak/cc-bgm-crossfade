export {}
declare global {
    namespace ig.BGM_DEFAULT_TRACKS {
        interface CrossfaceConfig {
            fadeInSpline: (t: number) => number
            fadeOutSpline: (t: number) => number
            fadeTime: number
        }
        interface Config {
            fieldBattleCrossface?: ig.BGM_DEFAULT_TRACKS.CrossfaceConfig
        }
    }
}
declare global {
    namespace ig {
        interface Music {
            crossover?: boolean
            crossoverMode?: ig.BGM_DEFAULT_TRACKS.CrossfaceConfig
            crossoverTrackData: { startTime: number; loopCount: number }
            crossoverTrack?: ig.Music.Track
        }
    }
}
export function injectBgmCrossover() {
    /* run in prestart */
    ig.Bgm.inject({
        pushDefaultTrackType(type, mode) {
            if (!this.mapDefaultTrackSet) return this.parent(type, mode)
            const targetMode = ig.BGM_DEFAULT_TRACKS[this.mapDefaultTrackSet.name].fieldBattleCrossface
            if (!targetMode || (type != 'field' && type != 'battle' && type != 'rankBattle'))
                return this.parent(type, mode)
            ig.music.crossover = true
            ig.music.crossoverMode = targetMode
            this.parent(type, 'FAST')
        },
        popDefaultTrackType(mode) {
            if (!this.mapDefaultTrackSet) return this.parent(mode)
            const type = this.defaultTrackTypeStack.last()
            const targetMode = ig.BGM_DEFAULT_TRACKS[this.mapDefaultTrackSet.name].fieldBattleCrossface
            if (!targetMode || (type != 'field' && type != 'battle' && type != 'rankBattle')) return this.parent(mode)
            ig.music.crossover = true
            ig.music.crossoverMode = targetMode
            this.parent('FAST')
        },
    })

    ig.Music.inject({
        _setFadeOut(fadeOut, paused) {
            if (!this.crossover || !this.crossoverMode) return this.parent(fadeOut, paused)
            const fadeTime = this.crossoverMode.fadeTime
            this.parent(fadeTime, paused)
            if (fadeTime != 0) {
                this.crossoverTrack = this.currentTrack
                this._playTopSong()
            }
        },
        _playTopSong() {
            if (!this.crossover || !this.crossoverMode) return this.parent()
            const t = this.currentTrack.track
            if (!(t instanceof ig.TrackWebAudio)) throw new Error('not supported')
            ig.music.crossoverTrackData = { startTime: t._startTime, loopCount: t._loopCount }
            this.parent()
        },
        _intervalStep() {
            if (!this.crossoverTrack || !this.crossoverMode) return this.parent()
            if (ig.system.windowFocusLost) return
            const percentDone = !this._timer ? 1 : this._timer.delta().map(-this._timer.target, 0, 0, 1).limit(0, 1)

            const inTrack = this.currentTrack.track
            if (!(inTrack instanceof ig.TrackWebAudio)) throw new Error('not supported')
            const inVolumeMulti = this.crossoverMode!.fadeInSpline(percentDone)
            inTrack.setVolume(inVolumeMulti * this._volume * this.currentTrack.volume)

            const outTrack = this.crossoverTrack.track
            if (!(outTrack instanceof ig.TrackWebAudio)) throw new Error('not supported')
            const outVolumeMulti = this.crossoverMode!.fadeOutSpline(percentDone)
            outTrack.setVolume(outVolumeMulti * this._volume * this.crossoverTrack.volume)

            // console.log('in:', inVolumeMulti, 'out:', outVolumeMulti, 'inTest:', inTest, 'outTest:', outTest, 'sum:', outTest+inTest)

            if (percentDone == 1) {
                this._endFadeIn()
                outTrack.pause()
                this.crossoverTrack = undefined
            }
        },
    })
    ig.TrackWebAudio.inject({
        play() {
            if (!ig.music.crossover) return this.parent()

            if (this.bufferHandle && !this.playing && this.bufferHandle.loaded) {
                this._startTime = ig.music.crossoverTrackData.startTime
                this._loopCount = ig.music.crossoverTrackData.loopCount
                this._pauseTime = ig.soundManager.context.getCurrentTime()

                ig.music.crossover = undefined
                return this.parent()
            } else throw new Error('huh')
        },
        pause() {
            if (!ig.music.crossover || !ig.music.crossoverMode || ig.music.crossoverMode.fadeTime == 0)
                return this.parent()
        },
    })
}
