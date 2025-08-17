<!-- markdownlint-disable MD013 MD024 MD001 MD045 -->

# cc-bgm-crossfade

[![CCModManager badge](https://raw.githubusercontent.com/CCDirectLink/CCModManager/refs/heads/master/icon/badge.png)](https://github.com/CCDirectLink/CCModManager)

Adds API for smoothly switching between the regular and battle background music

## Usage

When defining your trackset, add the `fieldBattleCrossfade`:
```typescript
ig.BGM_DEFAULT_TRACKS.myTrack = {
    field: { track: 'myFieldTrack', volume: 1 },
    battle: { track: 'myBattleTrack', volume: 1 },
    rankBattle: { track: 'myBattleTrack', volume: 1 },
    sRankBattle: { track: 's-rank', volume: 1 },
    fieldBattleCrossfade: {
        fadeTime: 2,
        fadeInSpline: t => Math.sqrt(t),
        fadeOutSpline: t => Math.sqrt(1 - t),
    },
}
```


## Building

```bash
git clone https://github.com/krypciak/cc-bgm-crossfade
cd cc-bgm-crossfade
pnpm install
pnpm run start
# this should return no errors (hopefully)
npx tsc
```
