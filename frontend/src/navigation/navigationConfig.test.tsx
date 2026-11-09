import { expect, test } from 'vitest';

import { MOBILE_PRIMARY_TABS, NAV_GROUPS } from './navigationConfig';

test('each navigation id is unique and mobile primary tabs exist once', () => {
  const ids = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id));

  expect(new Set(ids).size).toBe(ids.length);
  expect(MOBILE_PRIMARY_TABS).toEqual(['news', 'dashboard', 'compare', 'tco']);
  expect(MOBILE_PRIMARY_TABS.every((id) => ids.includes(id))).toBe(true);
  expect(ids[0]).toBe('news');
});
