// @vitest-environment happy-dom
import { expect, test, vi } from 'vitest';
import { renderDiagram, svgImage } from '../../../src/theme/mermaid/render';

const mocks = vi.hoisted(() => ({ initialize: vi.fn(), render: vi.fn() }));
vi.mock('mermaid', () => ({ default: mocks }));

test('SVG gets intrinsic dimensions, keeps its viewBox, and rejects invalid XML', () => {
  const url = svgImage(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 900 1600"/>',
  );
  const svg = decodeURIComponent(url.split(',')[1]);
  expect(svg).toContain('width="900"');
  expect(svg).toContain('height="1600"');
  expect(svg).toContain('viewBox="0 0 900 1600"');
  expect(() => svgImage('<html/>')).toThrow('SVG 无效');
});

test('theme configuration and rendering stay serialized, and an error does not poison the queue', async () => {
  const calls: string[] = [];
  mocks.initialize.mockImplementation((config) => calls.push(config.theme));
  mocks.render.mockImplementation(async (id: string) => {
    calls.push(id);
    if (id === 'bad') throw new Error('invalid graph');
    await Promise.resolve();
    return { svg: `<svg id="${id}"/>` };
  });
  const results = await Promise.allSettled([
    renderDiagram('bad', 'broken', false),
    renderDiagram('good', 'flowchart LR; A-->B', true),
  ]);
  expect(results[0].status).toBe('rejected');
  expect(results[1]).toEqual({ status: 'fulfilled', value: '<svg id="good"/>' });
  expect(calls).toEqual(['default', 'bad', 'dark', 'good']);
  expect(mocks.initialize).toHaveBeenLastCalledWith(
    expect.objectContaining({ securityLevel: 'strict', suppressErrorRendering: true }),
  );
});

test('custom themes are used in both modes without leaking into later default renders', async () => {
  mocks.render.mockResolvedValue({ svg: '<svg/>' });
  const config = { theme: 'base', themeVariables: { primaryColor: '#42b883' } } as const;
  for (const dark of [false, true]) {
    await renderDiagram('custom', 'flowchart LR; A-->B', dark, config);
    expect(mocks.initialize).toHaveBeenLastCalledWith({
      startOnLoad: false,
      securityLevel: 'strict',
      suppressErrorRendering: true,
      ...config,
    });
  }
  await renderDiagram('default', 'flowchart LR; A-->B', false);
  expect(mocks.initialize).toHaveBeenLastCalledWith(
    expect.objectContaining({ theme: 'default', themeVariables: undefined }),
  );
});
