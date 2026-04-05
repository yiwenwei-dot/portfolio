# yiwen.bio

Personal portfolio site for Yiwen Wei, built from a Canva export with custom JavaScript interactions, subpages, and a hidden music player.

**Live at [yiwen.bio](https://yiwen.bio)**

## Overview

The site is a single-page portfolio with interactive hover effects, animated text, and navigation to several subpages. Originally exported from Canva as static HTML, it has been extended with custom JS/CSS to add interactivity that Canva doesn't natively support.

## Structure

```
index.html              Main portfolio page (Canva export + custom scripts)
article.html            Translated WeChat article ("Are You Truly Open-Minded?")
teach.html              Teaching portfolio (student work, videos, course design, awards)
talk.html               Speaking event photo gallery
smile.html              Photo gallery
teachingalive.html      Teaching photo page

css/
  custom.css            Hover effects, tooltips, video modal, gradient text, animations
  fonts.css             @font-face declarations for Canva fonts
  music-player.css      Music player widget styles

js/
  custom.js             All interactive behavior (hover, tooltips, click handlers, mobile)
  music-player.js       Self-contained music player (5 tracks)
  inline_scripts.js     Canva runtime scripts

music_player/           MP3 audio files
_assets/
  fonts/                Canva web fonts (.woff, .woff2)
  images/               Photos, QR codes, favicon, student work, teaching assets
  media/                Self-introduction video
  *.ltr.css             Canva-generated stylesheets
```

## Interactive Elements

| Element | Hover | Click |
|---------|-------|-------|
| **01** | Enlarges 100%, tooltip "readingandwritingaremypassion.com" | Opens article.html |
| **02** | Enlarges 100%, tooltip "learningisfun.com" | Opens teach.html |
| **03** | Enlarges 100%, tooltip "confidentspeakersmakethingssimple.com" | Opens talk.html |
| **I talk** | Enlarges 20%, tooltip "bookameeting.com" | Opens cal.com/ayawei |
| **I teach** | Enlarges 20%, tooltip "teachingistailoring.com" | Opens teachingalive.html |
| **I think** | Enlarges 20%, tooltip "integratedthinkingcasestudy.com" | Opens Miro board |
| **Who am I?** | Enlarges 20%, tooltip "mein30seconds.com" | Plays self-introduction video |
| **CMU** | Gradient glow animation | Opens CMU profile |
| **technology** | Gradient glow animation | Opens TurtleTalk demo |
| **smile** | Gradient glow animation | Opens smile.html |
| **humane** | Gradient glow animation | Reveals music player |
| **essence** | Enlarges 20% | Plays "Por una Cabeza" |

## Technical Notes

- **Canva layout**: The HTML is a single-line Canva export with deeply nested divs and individual letter spans (`.a_GcMg` inside `.xtSH_A`). Click detection uses `getBoundingClientRect()` to work through Canva's overlay divs.
- **Desktop scaling**: The canvas (1903x928) is scaled with CSS transform to fill the viewport.
- **Mobile**: Custom repositioning with `vw` units; touch tooltips auto-dismiss after 2 seconds.
- **Gradient text**: Uses `background-clip: text` with `display: inline !important` to override Canva's `inline-flex` letter layout and prevent character overlap.
- **All navigation** uses `window.open(url, '_self')` for same-tab redirects.

## Deployment

Hosted on Vercel with custom domain.

```bash
npx vercel --prod
```

## Local Development

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

## Favicon

Custom script "Y" in Snell Roundhand on a navy circle, replacing the default Canva "C" logo. Generated with Pillow from `_assets/images/e53c4bd8da5e491d9ab09e7cf0daf874.png`.
