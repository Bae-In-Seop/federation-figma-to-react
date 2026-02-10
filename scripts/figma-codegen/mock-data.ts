/**
 * Mock Figma API response for development/testing
 * Use this when rate limited or testing without real Figma access
 */

export const mockFigmaResponse = {
  nodes: {
    '11:4': {
      document: {
        id: '11:4',
        name: 'TestButton',
        type: 'FRAME',
        children: [
          {
            id: '11:5',
            name: 'Background',
            type: 'RECTANGLE',
            absoluteBoundingBox: { x: 0, y: 0, width: 120, height: 40 },
            fills: [
              {
                type: 'SOLID',
                color: { r: 0.2, g: 0.5, b: 1, a: 1 },
              },
            ],
            cornerRadius: 8,
            strokeWeight: 0,
          },
          {
            id: '11:6',
            name: 'Label',
            type: 'TEXT',
            absoluteBoundingBox: { x: 20, y: 10, width: 80, height: 20 },
            characters: 'Click Me',
            style: {
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: 14,
              textAlignHorizontal: 'CENTER',
              textAlignVertical: 'CENTER',
            },
            fills: [
              {
                type: 'SOLID',
                color: { r: 1, g: 1, b: 1, a: 1 },
              },
            ],
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 120, height: 40 },
        backgroundColor: { r: 0, g: 0, b: 0, a: 0 },
      },
    },
  },
};
