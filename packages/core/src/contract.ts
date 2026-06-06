/**
 * Type-safe message contract (gRPC/Protobuf intent).  [v1.2]
 * The wire schema is defined in proto/agent.proto; here we provide a zod-validated, type-safe
 * serialization layer (JSON wire today; swap to grpc-js + protobufjs for a distributed transport).
 */
import { z } from "zod";
export const PartZ = z.object({ type: z.string(), text: z.string() });
export const AgentMessageZ = z.object({ taskId: z.string(), role: z.string(), parts: z.array(PartZ) });
export const AgentTaskZ = z.object({ id: z.string(), skill: z.string(), input: AgentMessageZ });
export const BidZ = z.object({ worker: z.string(), cost: z.number(), confidence: z.number() });

export function encode<T>(schema: z.ZodType<T>, value: T): string { return JSON.stringify(schema.parse(value)); }
export function decode<T>(schema: z.ZodType<T>, wire: string): T { return schema.parse(JSON.parse(wire)); }
