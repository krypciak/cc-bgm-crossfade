export {}
declare global {
    namespace ig.BGM_DEFAULT_TRACKS {
        interface CrossfaceConfig {
            fadeInSpline: (t: number) => number
            fadeOutSpline: (t: number) => number
            fadeTime: number
        }
        interface Config {
            fieldBattleCrossfade?: ig.BGM_DEFAULT_TRACKS.CrossfaceConfig
        }
    }
}
declare global {
    namespace ig {
        namespace Music {
            interface Track {
                track: ig.TrackWebAudio
            }
        }
        interface Music {
            crossover?: boolean
            crossoverMode?: ig.BGM_DEFAULT_TRACKS.CrossfaceConfig
            crossoverTrackData: { startTime: number; loopCount: number }
            crossoverTrack?: ig.Music.Track
        }
    }
}

const debug = false

export function injectBgmCrossover() {
    /* run in prestart */
    ig.Bgm.inject({
        pushDefaultTrackType(type, mode) {
            if (ig.game.isReset || !this.mapDefaultTrackSet) return this.parent(type, mode)
            const trackSet = ig.BGM_DEFAULT_TRACKS[this.mapDefaultTrackSet.name]
            const targetMode = trackSet.fieldBattleCrossfade
            if (targetMode && type == 'sRankBattle' && trackSet.rankBattle?.track == trackSet.sRankBattle?.track) return
            if (!targetMode || (type != 'field' && type != 'battle' && type != 'rankBattle')) {
                return this.parent(type, mode)
            }
            if (debug) {
                console.groupCollapsed('push', type)
                console.trace()
                console.groupEnd()
            }
            ig.music.crossover = true
            ig.music.crossoverMode = targetMode
            this.parent(type, 'FAST')
        },
        popDefaultTrackType(mode) {
            if (ig.game.isReset || !this.mapDefaultTrackSet) return this.parent(mode)
            const type = this.defaultTrackTypeStack.last()
            const trackSet = ig.BGM_DEFAULT_TRACKS[this.mapDefaultTrackSet.name]
            const targetMode = trackSet.fieldBattleCrossfade
            if (
                targetMode &&
                type == 'rankBattle' &&
                sc.model.isSRank() &&
                trackSet.rankBattle?.track == trackSet.sRankBattle?.track
            )
                return
            if (!targetMode || (type != 'field' && type != 'battle' && type != 'rankBattle')) return this.parent(mode)
            if (debug) {
                console.groupCollapsed('pop', type)
                console.trace()
                console.groupEnd()
            }
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
            ig.music.crossoverTrackData = { startTime: t._startTime, loopCount: t._loopCount }
            this._fadeInTime = this.crossoverMode.fadeTime
            this.parent()
        },
        _intervalStep() {
            if (!this.crossoverTrack || !this.crossoverMode) return this.parent()
            const inTrack = this.currentTrack.track
            const outTrack = this.crossoverTrack.track

            if (ig.system.windowFocusLost) return
            const percentDone = !this._timer ? 1 : this._timer.delta().map(-this._timer.target, 0, 0, 1).limit(0, 1)

            const inVolumeMulti = this.crossoverMode!.fadeInSpline(percentDone)
            const outVolumeMulti = this.crossoverMode!.fadeOutSpline(percentDone)

            inTrack.setVolume(inVolumeMulti * this._volume * this.currentTrack.volume)
            outTrack.setVolume(outVolumeMulti * this._volume * this.crossoverTrack.volume)

            if (debug) console.log('in:', inVolumeMulti, 'out:', outVolumeMulti)

            if (percentDone == 1) {
                this._endFadeIn()
                outTrack.pause()
                this.crossoverTrack = undefined
                this.crossoverMode = undefined
            }
        },
    })
    ig.TrackWebAudio.inject({
        play() {
            if (!ig.music.crossover) return this.parent()

            if (!(this.bufferHandle && !this.playing && this.bufferHandle.loaded)) throw new Error('huh')

            this._startTime = ig.music.crossoverTrackData.startTime
            this._loopCount = ig.music.crossoverTrackData.loopCount
            this._pauseTime = ig.soundManager.context.getCurrentTime()

            ig.music.crossover = undefined
            if (debug) console.log('setting ig.music.crossover = undefined')
            return this.parent()
        },
        pause() {
            if (
                !ig.music.crossover ||
                !ig.music.crossoverMode ||
                ig.music.crossoverMode.fadeTime == 0 ||
                sc.model.currentState == sc.GAME_MODEL_STATE.TITLE
            ) {
                if (debug) {
                    console.groupCollapsed('pause', this.cacheKey)
                    console.trace()
                    console.groupEnd()
                }
                return this.parent()
            }
            if (debug) {
                console.groupCollapsed('cancel pause', this.cacheKey)
                console.trace()
                console.groupEnd()
            }
        },
    })
}
