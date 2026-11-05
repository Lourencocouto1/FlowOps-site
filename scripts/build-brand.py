"""
Gera os ficheiros do logótipo da FlowOps em public/brand/.

- Símbolo: F em duas faixas + círculo âmbar com visto (geometria redesenhada a partir de
  flowops-site-kit/assets/brand/logo-referencia.png).
- Wordmark: "FlowOps" em Outfit ExtraBold (800), convertido em paths (o site não carrega a fonte).

Uso (precisa de fonttools e uharfbuzz):
  python scripts/build-brand.py caminho/para/Outfit[wght].ttf
"""
import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "brand"

GREEN, AQUA, AMBER, INK, WHITE = "#0F766E", "#5EEAD4", "#F59E0B", "#0F1F1C", "#FFFFFF"

# Símbolo em coordenadas próprias (viewBox 345 285 610 545)
SYM_BOX = (345, 285, 610, 545)
F_TOP = "M590 297H916Q946 297 937 326L928 360C917 402 886 428 848 428H585C500 428 440 470 401 540L437 410C455 345 510 297 590 297Z"
F_BOTTOM = "M392 655C425 540 495 484 585 484H812Q840 484 831 512L822 545C812 580 790 603 758 603H612C585 603 566 617 558 645L519 768C513 788 500 797 480 797H382Q352 797 360 768Z"
CIRCLE = (683, 730, 92)
CHECK = "M640 732L671 762L727 704"


def symbol(f_color, x=0.0, y=0.0, scale=1.0):
    """Grupo SVG do símbolo, com a origem do viewBox em (x, y)."""
    cx, cy, r = CIRCLE
    tx, ty = x - SYM_BOX[0] * scale, y - SYM_BOX[1] * scale
    return (
        f'<g transform="translate({tx:.2f} {ty:.2f}) scale({scale:.5f})">'
        f'<path fill="{f_color}" d="{F_TOP}"/><path fill="{f_color}" d="{F_BOTTOM}"/>'
        f'<circle fill="{AMBER}" cx="{cx}" cy="{cy}" r="{r}"/>'
        f'<path d="{CHECK}" fill="none" stroke="{WHITE}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>'
        "</g>"
    )


def wordmark(font_path):
    """Devolve (path_d, largura, cap_height) do texto 'FlowOps' em unidades da fonte (y para baixo, baseline em 0)."""
    vf = TTFont(font_path)
    font = instantiateVariableFont(vf, {"wght": 800}, inplace=False)
    tmp = OUT / ".outfit-800.ttf"
    font.save(tmp)
    blob = hb.Blob.from_file_path(str(tmp))
    hbfont = hb.Font(hb.Face(blob))
    buf = hb.Buffer()
    buf.add_str("FlowOps")
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": True})
    upm = font["head"].unitsPerEm
    tracking = -0.015 * upm  # igual ao letter-spacing da pré-visualização
    glyph_set = font.getGlyphSet()
    order = font.getGlyphOrder()
    pen = SVGPathPen(glyph_set)
    x = 0.0
    infos, positions = buf.glyph_infos, buf.glyph_positions
    for i, (info, pos) in enumerate(zip(infos, positions)):
        name = order[info.codepoint]
        glyph_set[name].draw(TransformPen(pen, (1, 0, 0, -1, x + pos.x_offset, -pos.y_offset)))
        x += pos.x_advance + (tracking if i < len(infos) - 1 else 0)
    cap = font["OS/2"].sCapHeight
    tmp.unlink()
    return pen.getCommands(), x, cap, upm


def svg(w, h, body, title, height=None):
    """height: altura intrínseca em px (a largura acompanha a proporção)."""
    hh = height or h
    ww = w * hh / h
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{ww:.0f}" height="{hh:.0f}" role="img" aria-labelledby="t">'
        f"<title id=\"t\">{title}</title>{body}</svg>\n"
    )


def main():
    font_path = sys.argv[1]
    OUT.mkdir(parents=True, exist_ok=True)
    d, text_w, cap, upm = wordmark(font_path)
    em = upm
    sym_h = 1.15 * em
    sym_scale = sym_h / SYM_BOX[3]
    sym_w = SYM_BOX[2] * sym_scale
    pad = 0.08 * em

    # Horizontal: símbolo centrado na altura das maiúsculas
    gap = 0.3 * em
    h = sym_h + 2 * pad
    baseline = pad + sym_h / 2 + cap / 2
    for name, f_color, txt in (("logo-horizontal", GREEN, INK), ("logo-horizontal-dark", AQUA, WHITE)):
        body = symbol(f_color, pad, pad, sym_scale)
        body += f'<path fill="{txt}" transform="translate({pad + sym_w + gap:.2f} {baseline:.2f})" d="{d}"/>'
        w = pad + sym_w + gap + text_w + pad
        (OUT / f"{name}.svg").write_text(svg(w, h, body, "FlowOps", height=120))

    # Vertical: símbolo maior em cima, texto centrado em baixo
    v_sym_h = 1.9 * em
    v_scale = v_sym_h / SYM_BOX[3]
    v_sym_w = SYM_BOX[2] * v_scale
    v_gap = 0.25 * em
    w = max(v_sym_w, text_w) + 2 * pad
    h = pad + v_sym_h + v_gap + cap + pad
    for name, f_color, txt in (("logo-vertical", GREEN, INK), ("logo-vertical-dark", AQUA, WHITE)):
        body = symbol(f_color, (w - v_sym_w) / 2, pad, v_scale)
        body += f'<path fill="{txt}" transform="translate({(w - text_w) / 2:.2f} {pad + v_sym_h + v_gap + cap:.2f})" d="{d}"/>'
        (OUT / f"{name}.svg").write_text(svg(w, h, body, "FlowOps", height=120))

    # Símbolo isolado
    for name, f_color in (("symbol", GREEN), ("symbol-dark", AQUA)):
        (OUT / f"{name}.svg").write_text(svg(SYM_BOX[2], SYM_BOX[3], symbol(f_color), "FlowOps", height=256))

    # Ícone de app (quadrado arredondado) e foto de perfil (círculo): F branco
    size = 512
    inner = size * 0.62
    s = inner / SYM_BOX[2]
    ox, oy = (size - inner) / 2, (size - SYM_BOX[3] * s) / 2
    app = f'<rect width="{size}" height="{size}" rx="{size * 0.22:.0f}" fill="{GREEN}"/>' + symbol(WHITE, ox, oy, s)
    (OUT / "icon-app.svg").write_text(svg(size, size, app, "FlowOps"))
    inner_c = size * 0.56
    s = inner_c / SYM_BOX[2]
    ox, oy = (size - inner_c) / 2, (size - SYM_BOX[3] * s) / 2
    prof = f'<circle cx="{size / 2}" cy="{size / 2}" r="{size / 2}" fill="{GREEN}"/>' + symbol(WHITE, ox, oy, s)
    (OUT / "icon-profile.svg").write_text(svg(size, size, prof, "FlowOps"))

    # Favicon: mais margem interior para ler bem a 16 px
    inner_f = size * 0.74
    s = inner_f / SYM_BOX[2]
    ox, oy = (size - inner_f) / 2, (size - SYM_BOX[3] * s) / 2
    fav = f'<rect width="{size}" height="{size}" rx="{size * 0.2:.0f}" fill="{GREEN}"/>' + symbol(WHITE, ox, oy, s)
    (ROOT / "public" / "favicon.svg").write_text(svg(size, size, fav, "FlowOps"))
    print("ok", sorted(p.name for p in OUT.glob("*.svg")))


if __name__ == "__main__":
    main()
