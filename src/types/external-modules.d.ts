declare module 'react-speech-recognition';
declare module 'speak-tts';
declare module "../../lib/imageTool" {
	export function generateImage(prompt: string): Promise<string>;
}