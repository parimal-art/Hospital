import { Button } from 'antd';
import React from 'react';
import { FiPrinter } from 'react-icons/fi';
export default function PrintButton() { return <Button icon={<FiPrinter />} onClick={() => window.print()}>Print</Button>; }
