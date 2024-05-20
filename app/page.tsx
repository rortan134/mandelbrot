"use client";

import "@radix-ui/themes/styles.css";
import {
  Flex,
  Section,
  Container,
  Heading,
  Button,
  Text,
  Badge,
} from "@radix-ui/themes";
import * as React from "react";

export const dynamic = "error";

const color = [200, 0, 255] as const;
const divergencia = 50;
const profundidad = 300;
const multiplicadorZoom = 0.8;

export default function HomePage() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const locationRef = React.useRef([-0.5, 0] as [number, number]);
  const scaleRef = React.useRef(2);

  function dibuixar_mandelbrot(
    posicion: [number, number],
    escala: number,
    valor_divergencia: number,
    profundidad: number,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ) {
    const escape_value = valor_divergencia * valor_divergencia;
    const width = canvas.width;
    const height = canvas.height;
    const image_data = ctx.getImageData(0, 0, width, height);
    const rgb = new Uint8ClampedArray(image_data.data.buffer);

    for (let i = 0; i < width; i++) {
      // Get the initial c value for our function f(z) = z^2 + c
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
        let contador = 0;

        let real = 0;
        let imaginary = 0;

        while (contador < profundidad) {
          const temp_real =
            real * real - imaginary * imaginary + componente_real;
          imaginary = 2 * real * imaginary + componente_imaginario;
          real = temp_real;

          // Exit the loop early if we determine that the function has diverged
          if (real * real + imaginary * imaginary > escape_value) {
            break;
          }

          contador++;
        }

        const rgb_index = (i + j * width) * 4;

        if (contador == profundidad) {
          // Punt no fa part de la fractal, el pintem de negre
          rgb[rgb_index] = 0;
          rgb[rgb_index + 1] = 0;
          rgb[rgb_index + 2] = 0;
        } else {
          // Punt fa part de la fractal, el pintem de color
          const intensidad = Math.sqrt(map(contador, 0, profundidad, 0, 1));
          rgb[rgb_index] = intensidad * color[0];
          rgb[rgb_index + 1] = intensidad * color[1];
          rgb[rgb_index + 2] = intensidad * color[2];
        }
      }
    }

    ctx.putImageData(image_data, 0, 0);
  }

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

  function handle_zoom(event: React.MouseEvent, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const click_x = event.clientX;
    const click_y = event.clientY;

    const mapped_x = map(
      click_x,
      0,
      window.innerWidth,
      locationRef.current[0] - scaleRef.current,
      locationRef.current[0] + scaleRef.current,
    );
    const mapped_y = map(
      click_y,
      0,
      window.innerHeight,
      locationRef.current[1] - scaleRef.current,
      locationRef.current[1] + scaleRef.current,
    );

    locationRef.current[0] =
      mapped_x - (mapped_x - locationRef.current[0]) * multiplicadorZoom;
    locationRef.current[1] =
      mapped_y - (mapped_y - locationRef.current[1]) * multiplicadorZoom;
    scaleRef.current *= multiplicadorZoom;

    dibuixar_mandelbrot(
      locationRef.current,
      scaleRef.current,
      divergencia,
      profundidad,
      canvas,
      ctx,
    );
  }

  function reiniciar_fractal(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!ctx) return;
    locationRef.current = [-0.5, 0];
    scaleRef.current = 1.5;
    dibuixar_mandelbrot(
      locationRef.current,
      scaleRef.current,
      divergencia,
      profundidad,
      canvas,
      ctx,
    );
  }

  function reiniciar_canvas(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ) {
    ctx.fillStyle = "#0E0B16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

  React.useLayoutEffect(function effect() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!ctx) return;

    const res = () => recalcularVentana(canvas, ctx);
    // Ensure everything fits on screen when resized
    window.addEventListener("resize", res);
    dibuixar_mandelbrot(
      locationRef.current,
      scaleRef.current,
      divergencia,
      profundidad,
      canvas,
      ctx,
    );

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
      <Section>
        <Container>
          <Flex direction="column" gap="2">
            <Flex gap="2">
              <Badge size="2" style={{ width: "fit-content" }}>
                Gilberto Samaritano Junior
              </Badge>
              <Badge size="2" style={{ width: "fit-content" }}>
                f(z) = z² + c
              </Badge>
            </Flex>
            <Heading size="5" weight="bold" style={{ maxWidth: "20rem" }}>
              Demostració. Fractal de Mandelbrot: Ús artistic de les funcions
              iterades en matemàtiques
            </Heading>
            <Text size="2" color="gray" style={{ maxWidth: "20rem" }}>
              Fes clic per a augmentar la escala de la fractal
            </Text>
            <Button
              style={{ width: "fit-content" }}
              onClick={() => reiniciar_fractal(canvasRef.current!)}
            >
              Reiniciar
            </Button>
          </Flex>
        </Container>
      </Section>
      <canvas
        className="absolute inset-0 -z-10 h-full w-full"
        ref={React.useCallback((node: HTMLCanvasElement | null) => {
          if (node) {
            canvasRef.current = node;
            const ctx = node.getContext("2d", { willReadFrequently: true });
            if (!ctx) return;
            // Resize everything upon launch and plot initial fractal
            recalcularVentana(node, ctx);
            // Draw Mandelbrot when the page opens
            dibuixar_mandelbrot(
              locationRef.current,
              scaleRef.current,
              divergencia,
              profundidad,
              node,
              ctx,
            );
          }
        }, [])}
        onPointerDown={(event) => handle_zoom(event, canvasRef.current!)}
      />
    </main>
  );
}
