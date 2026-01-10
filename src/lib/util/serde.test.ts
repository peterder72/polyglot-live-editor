import { describe, expect, it } from 'vitest';
import { serializeState, deserializeState, type SerdeType } from './serde';
import { defaultState } from './state';
import type { State } from '$lib/types';

const verifySerde = (state: State, serde?: SerdeType): string => {
  const serialized = serializeState(state, serde);
  const deserialized = deserializeState(serialized);
  expect(deserialized).to.deep.equal(state);
  return serialized;
};

describe('Serde tests', () => {
  it('should serialize and deserialize with default serde', () => {
    expect(verifySerde(defaultState)).toMatchInlineSnapshot(
      `"pako:eNpVjstqw0AMRX9FzKqB-Ae8KCR2m02gXWRVTxbCo3lQz4PxmFBs_3vlhECrjR73XEmz6KMiUQs9xFtvMRe4tDIAx6FrbHZj8TheoapelxMV8DHQzwLHl1OE0caUXDC7B3_cIGjm84YRFOvC9_qQmrv_I9ACbXfGVGK6_lUut7jAW-c-La__r9hM7HrvNNYaqx4zNJjviNjz70E7w9_P20CKYsmTFDWXijROQ5FChpVJ5dBk9Ix6yh6d4pnJnOqSJ9qLhOErRv9sc5yMFXxxGLmbksJC7XPFhqy_7-xlXA"`
    );
  });

  it('should serialize and deserialize with base64 serde', () => {
    expect(verifySerde(defaultState, 'base64')).toMatchInlineSnapshot(
      `"base64:eyJjb2RlIjoiZmxvd2NoYXJ0IFREXG4gICAgQVtDaHJpc3RtYXNdIC0tPnxHZXQgbW9uZXl8IEIoR28gc2hvcHBpbmcpXG4gICAgQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG4gICAgQyAtLT58T25lfCBEW0xhcHRvcF1cbiAgICBDIC0tPnxUd298IEVbaVBob25lXVxuICAgIEMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4gICIsImNvbmZpZyI6IntcbiAgXCJ0aGVtZVwiOiBcImRlZmF1bHRcIlxufSIsImRpYWdyYW0iOiJtZXJtYWlkIiwiZ3JpZCI6dHJ1ZSwicGFuWm9vbSI6dHJ1ZSwicm91Z2giOmZhbHNlLCJ1cGRhdGVEaWFncmFtIjp0cnVlfQ"`
    );
  });

  it('should serialize and deserialize with pako serde', () => {
    expect(verifySerde(defaultState, 'pako')).toMatchInlineSnapshot(
      `"pako:eNpVjstqw0AMRX9FzKqB-Ae8KCR2m02gXWRVTxbCo3lQz4PxmFBs_3vlhECrjR73XEmz6KMiUQs9xFtvMRe4tDIAx6FrbHZj8TheoapelxMV8DHQzwLHl1OE0caUXDC7B3_cIGjm84YRFOvC9_qQmrv_I9ACbXfGVGK6_lUut7jAW-c-La__r9hM7HrvNNYaqx4zNJjviNjz70E7w9_P20CKYsmTFDWXijROQ5FChpVJ5dBk9Ix6yh6d4pnJnOqSJ9qLhOErRv9sc5yMFXxxGLmbksJC7XPFhqy_7-xlXA"`
    );
  });

  it('should throw error for unrecognized serde', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    expect(() => serializeState(defaultState, 'unknown')).toThrowError(
      'Unknown serde type: unknown'
    );
    expect(() => deserializeState('unknown:hello')).toThrowError('Unknown serde type: unknown');
  });
});
