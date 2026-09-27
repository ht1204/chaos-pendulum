/**
 * Physics worker entry.
 * Instantiated from usePhysics via:
 *   new Worker(new URL("../physics/worker.ts", import.meta.url))
 * Keeps RK4 integration off the main thread.
 */
import {
  applyParams,
  createWorld,
  resetWorld,
  simulate,
  type World,
} from "./workerCore";
import type { WorkerCommand, WorkerMessage } from "./types";

let world: World | null = null;

type Post = (message: WorkerMessage, transfer?: Transferable[]) => void;
const post = (self.postMessage as unknown as Post).bind(self);

self.onmessage = (event: MessageEvent<WorkerCommand>) => {
  const msg = event.data;

  switch (msg.type) {
    case "init": {
      world = createWorld(msg.params, msg.size);
      post({ type: "ready" });
      break;
    }
    case "setParams": {
      if (world) applyParams(world, msg.patch);
      break;
    }
    case "reset": {
      if (world) resetWorld(world);
      break;
    }
    case "setRunning": {
      if (world) world.running = msg.running;
      break;
    }
    case "setSize": {
      // Guard: resize events with an unchanged size must not re-initialize
      // the world (prevents spurious resets from duplicate observations).
      if (world && msg.size > 0 && msg.size !== world.size) {
        world.size = msg.size;
        // Parity: the original re-initializes pendulums on resize
        // (index.html:535–543).
        resetWorld(world);
      }
      break;
    }
    case "tick": {
      if (!world) return;
      const steps = world.running ? world.params.speed : 0;
      const { buffer, pendulums, steps: done } = simulate(world, steps);
      post(
        {
          type: "frames",
          buffer,
          pendulums,
          steps: done,
          totalSteps: world.totalSteps,
        },
        [buffer.buffer]
      );
      break;
    }
  }
};
