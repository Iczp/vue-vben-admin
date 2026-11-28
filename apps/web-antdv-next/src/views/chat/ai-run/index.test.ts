import { describe, expect, it, vi } from 'vitest';

const mockDelete = vi.hoisted(() => vi.fn());

vi.mock('#/api/request', () => ({
  requestClient: {
    delete: mockDelete,
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { deleteAiRunManyApi } from '#/api/chat/ai-run';

describe('ai-run API', () => {
  it('serializes idList with repeat paramsSerializer for deleteAiRunManyApi', async () => {
    mockDelete.mockResolvedValueOnce(undefined);
    const idList = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
    ];

    await deleteAiRunManyApi(idList);

    expect(mockDelete).toHaveBeenCalledWith('/chat/admin/ai-run/many', {
      params: { idList },
      paramsSerializer: 'repeat',
    });
  });
});
