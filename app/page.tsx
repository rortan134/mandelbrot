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
const divergence_threshold = 50;
const depth = 300;
const zoom_amount = 0.8;

export default function HomePage() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const locationRef = React.useRef([-0.5, 0] as [number, number]);
  const scaleRef = React.useRef(2);

  // Plot the mandelbrot function on the canvas
  function draw_mandelbrot(
    location: [number, number],
    scale: number,
    divergence_threshold: number,
    depth: number,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ) {
    const escape_value = divergence_threshold * divergence_threshold;
    const width = canvas.width;
    const height = canvas.height;
    const image_data = ctx.getImageData(0, 0, width, height);
    const rgb = new Uint8ClampedArray(image_data.data.buffer);
    const start = performance.now();

    for (let i = 0; i < width; i++) {
      // Get the initial c value for our function f(z) = z^2 + c
      const real_component = map(
        i,
        0,
        width,
        location[0] - scale,
        location[0] + scale,
      );
      for (let j = 0; j < height; j++) {
        const imaginary_component = map(
          j,
          0,
          height,
          location[1] - scale,
          location[1] + scale,
        );
        let count = 0;

        // Initial z values (z is complex)
        let real = 0;
        let imaginary = 0;

        // Iterate f(z) = z^2 + c for a given number of steps
        while (count < depth) {
          const temp_real =
            real * real - imaginary * imaginary + real_component;
          imaginary = 2 * real * imaginary + imaginary_component;
          real = temp_real;

          // Exit the loop early if we determine that the function has diverged
          if (real * real + imaginary * imaginary > escape_value) {
            break;
          }

          count++;
        }

        const rgb_index = (i + j * width) * 4;

        // Fill with black if the point is within the Mandelbrot set
        if (count == depth) {
          rgb[rgb_index] = 0;
          rgb[rgb_index + 1] = 0;
          rgb[rgb_index + 2] = 0;
        } else {
          // Otherwise, color it progressively more intense as it took more iterations to diverge in our loop
          const intensity = Math.sqrt(map(count, 0, depth, 0, 1));
          rgb[rgb_index] = intensity * color[0];
          rgb[rgb_index + 1] = intensity * color[1];
          rgb[rgb_index + 2] = intensity * color[2];
        }
      }
    }
    const end = performance.now();
    console.log(`Rendered in ${end - start}ms`);
    ctx.putImageData(image_data, 0, 0);
  }

  // Map an input in a given range to another range
  function map(
    input: number,
    input_min: number,
    input_max: number,
    output_min: number,
    output_max: number,
  ) {
    const normalized_input = (input - input_min) / (input_max - input_min);
    const mapped_input =
      output_min + normalized_input * (output_max - output_min);
    return mapped_input;
  }

  // Zooming and keeping clicked pixel in place on screen for smoothness
  function handle_zoom(event: React.MouseEvent, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Get where the user clicked in terms of the canvas width/height coordinate system
    const click_x = event.clientX;
    const click_y = event.clientY;

    // Map the user's click to the range of real/imaginary numbers represented on the canvas
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

    // Move the origin
    locationRef.current[0] =
      mapped_x - (mapped_x - locationRef.current[0]) * zoom_amount;
    locationRef.current[1] =
      mapped_y - (mapped_y - locationRef.current[1]) * zoom_amount;
    // Zoom and draw
    scaleRef.current *= zoom_amount;

    draw_mandelbrot(
      locationRef.current,
      scaleRef.current,
      divergence_threshold,
      depth,
      canvas,
      ctx,
    );
  }

  // Go back to original fractal
  function reset_fractal(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!ctx) return;
    locationRef.current = [-0.5, 0];
    scaleRef.current = 1.5;
    draw_mandelbrot(
      locationRef.current,
      scaleRef.current,
      divergence_threshold,
      depth,
      canvas,
      ctx,
    );
  }

  // Clear the canvas
  function reset_canvas(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ) {
    ctx.fillStyle = "#0E0B16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Make everything fit on screen
  function fit(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    if (window.innerWidth * 0.65 > window.innerHeight * 0.8) {
      canvas.height = Math.floor(window.innerHeight * 0.8 * 0.75);
      canvas.width = canvas.height;
    } else {
      canvas.width = Math.floor(window.innerWidth * 0.65 * 0.75);
      canvas.height = canvas.width;
    }
    reset_canvas(canvas, ctx);
  }

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!ctx) return;

    const res = () => fit(canvas, ctx);
    // Ensure everything fits on screen when resized
    window.addEventListener("resize", res);
    draw_mandelbrot(
      locationRef.current,
      scaleRef.current,
      divergence_threshold,
      depth,
      canvas,
      ctx,
    );

    return () => {
      window.removeEventListener("resize", res);
      reset_canvas(canvas, ctx);
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
                z² + c
              </Badge>
            </Flex>
            <Heading size="5" weight="bold" style={{ maxWidth: "20rem" }}>
              Demostració. Fractal de Mandelbrot: Ús artistic de les funcions
              iterades en matemàtiques
            </Heading>
            <Button onClick={() => reset_fractal(canvasRef.current!)}>
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
            fit(node, ctx);
            // Draw Mandelbrot when the page opens
            draw_mandelbrot(
              locationRef.current,
              scaleRef.current,
              divergence_threshold,
              depth,
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
