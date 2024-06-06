"use client";

import "@radix-ui/themes/styles.css";
import {
  Flex,
  Container,
  Heading,
  Button,
  Text,
  Badge,
  Strong,
  Tabs
} from "@radix-ui/themes";
import * as React from "react";

export const dynamic = "force-static";

const color = [200, 0, 255] as const;
const divergencia = 100;
const profundidad = 350;
const multiplicadorZoom = 0.8;
const escape_value = divergencia * divergencia;
const posicionInicial = [-0.5, 0] as [number, number];

function map(
  input: number,
  input_min: number,
  input_max: number,
  output_min: number,
  output_max: number,
) {
  const input_normalizado = (input - input_min) / (input_max - input_min);
  const input_mapped =
    output_min + input_normalizado * (output_max - output_min);
  return input_mapped;
}

function reiniciar_canvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) {
  ctx.fillStyle = "#0E0B16";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export default function HomePage() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  if (!ctxRef.current && canvasRef.current) {
    ctxRef.current = canvasRef.current.getContext("2d", {
      willReadFrequently: true,
    });
  }
  const positionRef = React.useRef(posicionInicial);
  const scaleRef = React.useRef(2);

  function dibuixar_mandelbrot(
    posicion: [number, number],
    escala: number,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ) {
    const width = canvas.width;
    const height = canvas.height;
    const image_data = ctx.getImageData(0, 0, width, height);
    const rgb = new Uint8ClampedArray(image_data.data.buffer);

    for (let i = 0; i < width; i++) {
      const componente_real = map(
        i,
        0,
        width,
        posicion[0] - escala,
        posicion[0] + escala,
      );

      for (let j = 0; j < height; j++) {
        const componente_imaginario = map(
          j,
          0,
          height,
          posicion[1] - escala,
          posicion[1] + escala,
        );

        let real = 0;
        let imaginary = 0;
        let iteracions = 0;

        while (iteracions < profundidad) {
          const temp_real =
            real * real - imaginary * imaginary + componente_real;
          imaginary = 2 * real * imaginary + componente_imaginario;
          real = temp_real;
          // Sortir del bucle abans d'hora si determinem que la funció ha divergit
          if (real * real + imaginary * imaginary > escape_value) {
            break;
          }
          iteracions++;
        }

        const rgb_index = (i + j * width) * 4;
        if (iteracions == profundidad) {
          // Punt no fa part de la fractal, el pintem de negre
          rgb[rgb_index] = 0;
          rgb[rgb_index + 1] = 0;
          rgb[rgb_index + 2] = 0;
        } else {
          // Punt fa part de la fractal, el pintem de color
          const intensidad = Math.sqrt(map(iteracions, 0, profundidad, 0, 1));
          rgb[rgb_index] = intensidad * color[0];
          rgb[rgb_index + 1] = intensidad * color[1];
          rgb[rgb_index + 2] = intensidad * color[2];
        }
      }
    }
    ctx.putImageData(image_data, 0, 0);
  }

  function handle_zoom(event: React.MouseEvent) {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const click_x = event.clientX;
    const click_y = event.clientY;

    const mapped_x = map(
      click_x,
      0,
      window.innerWidth,
      positionRef.current[0] - scaleRef.current,
      positionRef.current[0] + scaleRef.current,
    );
    const mapped_y = map(
      click_y,
      0,
      window.innerHeight,
      positionRef.current[1] - scaleRef.current,
      positionRef.current[1] + scaleRef.current,
    );

    positionRef.current[0] =
      mapped_x - (mapped_x - positionRef.current[0]) * multiplicadorZoom;
    positionRef.current[1] =
      mapped_y - (mapped_y - positionRef.current[1]) * multiplicadorZoom;
    scaleRef.current *= multiplicadorZoom;

    dibuixar_mandelbrot(positionRef.current, scaleRef.current, canvas, ctx);
  }

  function reiniciar_fractal(_e: never) {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    positionRef.current = posicionInicial;
    scaleRef.current = 2;
    dibuixar_mandelbrot(positionRef.current, scaleRef.current, canvas, ctx);
  }

  function recalcularVentana(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ) {
    if (window.innerWidth * 0.65 > window.innerHeight * 0.8) {
      canvas.height = Math.floor(window.innerHeight * 0.8 * 0.75);
      canvas.width = canvas.height;
    } else {
      canvas.width = Math.floor(window.innerWidth * 0.65 * 0.75);
      canvas.height = canvas.width;
    }
    reiniciar_canvas(canvas, ctx);
  }

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const res = () => {
      recalcularVentana(canvas, ctx);
      dibuixar_mandelbrot(positionRef.current, scaleRef.current, canvas, ctx);
    };

    window.addEventListener("resize", res);
    dibuixar_mandelbrot(positionRef.current, scaleRef.current, canvas, ctx);

    return () => {
      window.removeEventListener("resize", res);
      reiniciar_canvas(canvas, ctx);
    };
  }, []);

  return (
    <main
      id="main"
      tabIndex={-1}
      role="main"
      className="relative isolate h-screen w-full"
    >
      <Container
        style={{
          width: "100%",
          maxWidth: "20rem",
          minWidth: "0",
          position: "absolute",
          top: "2rem",
          left: "2rem",
        }}
      >
        <Flex direction="column" gap="2">
          <Flex gap="2" style={{ pointerEvents: "none" }}>
            <Badge size="2" style={{ width: "fit-content" }}>
              f(z) = z² + c
            </Badge>
            <Badge size="2" style={{ width: "fit-content" }}>
              Per: Gilberto Samaritano Junior
            </Badge>
          </Flex>
          <Heading size="5" weight="bold" style={{ pointerEvents: "none" }}>
            Demostració. Fractal de Mandelbrot: Ús artistic de les funcions
            iterades en matemàtiques
          </Heading>
          <Text size="2" color="gray" style={{ pointerEvents: "none" }}>
            Fes clic per <Strong>augmentar la escala</Strong> de la fractal
          </Text>
          <Button
            style={{ width: "fit-content" }}
            onClick={reiniciar_fractal}
            onPointerDown={reiniciar_fractal}
          >
            Reiniciar
          </Button>
        </Flex>
      </Container>
      <canvas
        className="absolute inset-0 -z-10 h-full w-full cursor-zoom-in"
        ref={React.useCallback((node: HTMLCanvasElement | null) => {
          if (node) {
            canvasRef.current = node;
            const ctx = node.getContext("2d", { willReadFrequently: true });
            ctxRef.current = ctx;
            if (!ctx) return;
            recalcularVentana(node, ctx);
            dibuixar_mandelbrot(
              positionRef.current,
              scaleRef.current,
              node,
              ctx,
            );
          }
        }, [])}
        onPointerDown={handle_zoom}
      />
    </main>
  );
}
