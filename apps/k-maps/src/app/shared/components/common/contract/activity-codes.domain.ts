export const ACTIVITY_CODES_COMMON = ['200', '201', '203', '205', '245', '362', '831', '832', '834', '835', '930'];

export const ACTIVITY_CODES_MEANS_ROAD = ['261', '262', '345', '354', '361'];

export const ACTIVITY_CODES_TRANSPORT_ROAD = [
  '261',
  '262',
  '277',
  '278',
  '280',
  '281',
  '283',
  '310',
  '329',
  '331',
  '332',
  '333',
  '334',
  '335',
  '336',
  '337',
  '338',
  '339',
  '340',
  '341',
  '342',
  '343',
  '344',
  '345',
  '346',
  '347',
  '348',
  '349',
  '361',
  '390'
];

export const ACTIVITY_CODES_SERVICE = ['211', '213', '214', '215', '224', '226', '284', '285', '286', '270', '271', '273', '274', '275', '276', '277', '278', '287', '288', '400'];
export const NOT_ACTIVITY_CODES_SERVICE = ['280', '281', '283', '930'];

export const ACTIVITY_CODES_ADDITIONAL_SERVICE = [
  '211',
  '213',
  '214',
  '215',
  '220',
  '222',
  '224',
  '225',
  '226',
  '240',
  '241',
  '242',
  '243',
  '244',
  '245',
  '246',
  '247',
  '400',
  '401',
  '403',
  '404',
  '405',
  '406',
  '410',
  '412',
  '413',
  '761',
  '763',
  '769'
];

export const ACTIVITY_CODES = Array.from(new Set([...ACTIVITY_CODES_COMMON, ...ACTIVITY_CODES_MEANS_ROAD, ...ACTIVITY_CODES_TRANSPORT_ROAD]));
