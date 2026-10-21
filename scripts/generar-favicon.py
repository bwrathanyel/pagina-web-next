"""Genera app/favicon.ico con la marca de Lotus 360.

El .ico que había (círculo negro con triángulo blanco) era un logo viejo y es el
que el navegador usa en la pestaña, aunque icon.png y apple-icon.png ya tengan
la marca. Acá se toma el ícono de marca que ya usa el CRM (misma marca, fondo
dusk y montaña blanca, pensado para tamaños chicos), se recorta al arte y se
guardan 4 tamaños.

Fuente: ../redireccion-whatsapp/crm/icons/icon-192.png (repo del CRM, mismo
workspace). Uso: python scripts/generar-favicon.py
"""

from pathlib import Path

from PIL import Image, ImageChops

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ.parent / "redireccion-whatsapp" / "crm" / "icons" / "icon-192.png"
DESTINO = RAIZ / "app" / "favicon.ico"
MARGEN = 0.10
TAMANOS = (16, 32, 48, 256)


def marca_cuadrada() -> Image.Image:
    icono = Image.open(ORIGEN).convert("RGBA")
    fondo = icono.getpixel((1, 1))
    resta = ImageChops.difference(icono.convert("RGB"), Image.new("RGB", icono.size, fondo[:3]))
    caja = resta.convert("L").point(lambda v: 255 if v > 24 else 0).getbbox()

    arte = icono.crop(caja)
    ancho, alto = arte.size
    lado = round(max(ancho, alto) * (1 + MARGEN * 2))
    lienzo = Image.new("RGBA", (lado, lado), fondo)
    lienzo.paste(arte, ((lado - ancho) // 2, (lado - alto) // 2), arte)
    return lienzo


def main() -> None:
    base = marca_cuadrada()
    cuadros = [base.resize((t, t), Image.LANCZOS) for t in TAMANOS]
    cuadros[-1].save(DESTINO, format="ICO", sizes=[(t, t) for t in TAMANOS])
    print(f"{DESTINO.relative_to(RAIZ)}: {', '.join(f'{t}px' for t in TAMANOS)}")


if __name__ == "__main__":
    main()
