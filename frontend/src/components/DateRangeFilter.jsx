import { DatePicker } from 'antd';
import React from 'react';
export default function DateRangeFilter({ onChange }) { return <DatePicker.RangePicker onChange={onChange} />; }
