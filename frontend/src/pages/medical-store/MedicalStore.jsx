import { Alert, Button, Card, Col, DatePicker, Divider, Form, Input, InputNumber, message, Row, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { FiPackage, FiPlus, FiRefreshCcw, FiShoppingCart } from 'react-icons/fi';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import FormDrawer from '../../components/FormDrawer.jsx';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import StatCard from '../../components/StatCard.jsx';
import CurrencyText from '../../components/CurrencyText.jsx';
import StatusTag from '../../components/StatusTag.jsx';
import ConfirmAction from '../../components/ConfirmAction.jsx';
import { formatDate } from '../../utils/formatDate.js';

const priorityColors = {
  Immediate: 'red',
  High: 'volcano',
  Medium: 'orange',
  Low: 'gold',
  OK: 'green'
};

const dosageOptions = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Powder', 'Other'].map((value) => ({ label: value, value }));
const paymentOptions = ['Cash', 'Bank', 'UPI', 'Card', 'Cheque', 'Other'].map((value) => ({ label: value, value }));

const priorityTag = (priority) => <Tag color={priorityColors[priority?.label] || 'default'}>{priority?.label || 'OK'}</Tag>;

export default function MedicalStore() {
  const [medicineForm] = Form.useForm();
  const [stockForm] = Form.useForm();
  const [saleForm] = Form.useForm();
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [saleSearch, setSaleSearch] = useState('');
  const [medicineOpen, setMedicineOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [stockMedicine, setStockMedicine] = useState(null);
  const [compositionSearch, setCompositionSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [medicineRes, saleRes, admissionRes, dashboardRes] = await Promise.all([
        api.get('/medical-store/medicines', { params: { search: medicineSearch } }),
        api.get('/medical-store/sales', { params: { search: saleSearch } }),
        api.get('/admissions'),
        api.get('/medical-store/dashboard')
      ]);
      setMedicines(medicineRes.data.data || []);
      setSales(saleRes.data.data || []);
      setAdmissions(admissionRes.data.data || []);
      setDashboard(dashboardRes.data.data || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => load(), 300);
    return () => clearTimeout(timer);
  }, [medicineSearch, saleSearch]);

  const startMedicine = (medicine = null) => {
    setEditingMedicine(medicine);
    medicineForm.resetFields();
    if (medicine) {
      medicineForm.setFieldsValue({
        ...medicine,
        expiryDate: medicine.expiryDate ? dayjs(medicine.expiryDate) : undefined
      });
    }
    setMedicineOpen(true);
  };

  const saveMedicine = async (values) => {
    setSaving(true);
    try {
      const payload = { ...values, expiryDate: values.expiryDate?.toISOString?.() };
      if (editingMedicine) await api.put(`/medical-store/medicines/${editingMedicine._id}`, payload);
      else await api.post('/medical-store/medicines', payload);
      message.success(editingMedicine ? 'Medicine updated.' : 'Medicine added.');
      setMedicineOpen(false);
      setEditingMedicine(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const startStock = (medicine) => {
    setStockMedicine(medicine);
    stockForm.resetFields();
    stockForm.setFieldsValue({
      purchaseRate: medicine.purchaseRate,
      mrp: medicine.mrp,
      saleRate: medicine.saleRate,
      batchNo: medicine.batchNo,
      expiryDate: medicine.expiryDate ? dayjs(medicine.expiryDate) : undefined,
      reorderLevel: medicine.reorderLevel
    });
    setStockOpen(true);
  };

  const saveStock = async (values) => {
    setSaving(true);
    try {
      await api.patch(`/medical-store/medicines/${stockMedicine._id}/stock`, {
        ...values,
        expiryDate: values.expiryDate?.toISOString?.()
      });
      message.success('Stock added successfully.');
      setStockOpen(false);
      setStockMedicine(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const createSale = async (values) => {
    const items = (values.items || []).filter((item) => item?.medicine && Number(item.quantity || 0) > 0);
    if (!items.length) {
      message.error('Add at least one medicine item.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/medical-store/sales', {
        ...values,
        date: values.date?.toISOString?.(),
        items
      });
      message.success('Bill generated and medicine stock deducted.');
      saleForm.resetFields();
      saleForm.setFieldsValue({ saleType: 'Outsider', date: dayjs(), paymentMode: 'Cash', items: [{}] });
      load();
    } finally {
      setSaving(false);
    }
  };

  const cancelSale = async (sale) => {
    await api.patch(`/medical-store/sales/${sale._id}/cancel`, { cancelReason: 'Cancelled from medical store dashboard' });
    message.success('Bill cancelled and stock restored.');
    load();
  };

  const medicineOptions = useMemo(() => medicines
    .filter((medicine) => medicine.status === 'Active')
    .map((medicine) => ({
      label: `${medicine.marketName} | ${medicine.composition} | Stock: ${medicine.stockQty} ${medicine.unit || ''} | ₹${medicine.saleRate || medicine.mrp || 0}`,
      value: medicine._id,
      medicine
    })), [medicines]);

  const compositionRows = useMemo(() => {
    if (!compositionSearch) return dashboard?.compositionSummary || [];
    const search = compositionSearch.toLowerCase();
    const grouped = medicines
      .filter((medicine) => medicine.composition?.toLowerCase().includes(search) || medicine.marketName?.toLowerCase().includes(search))
      .reduce((acc, medicine) => {
        const key = medicine.composition || 'Unknown';
        if (!acc[key]) acc[key] = { composition: key, totalStock: 0, medicineCount: 0, marketNames: [] };
        acc[key].totalStock += Number(medicine.stockQty || 0);
        acc[key].medicineCount += 1;
        acc[key].marketNames.push(medicine.marketName);
        return acc;
      }, {});
    return Object.values(grouped);
  }, [compositionSearch, dashboard, medicines]);

  const medicineColumns = [
    { title: 'Medicine', dataIndex: 'marketName', fixed: 'left', width: 180 },
    { title: 'Composition', dataIndex: 'composition', width: 260 },
    { title: 'Company', dataIndex: 'company', width: 140 },
    { title: 'Batch', dataIndex: 'batchNo', width: 110 },
    { title: 'Expiry', dataIndex: 'expiryDate', render: formatDate, width: 110 },
    { title: 'Stock', dataIndex: 'stockQty', render: (_, row) => `${row.stockQty || 0} ${row.unit || ''}`, width: 110 },
    { title: 'Priority', render: (_, row) => priorityTag(row.stockPriority), width: 120 },
    { title: 'Purchase', dataIndex: 'purchaseRate', render: (value) => <CurrencyText value={value} />, width: 110 },
    { title: 'Sale Rate', dataIndex: 'saleRate', render: (value) => <CurrencyText value={value} />, width: 110 },
    { title: 'Status', dataIndex: 'status', render: (value) => <StatusTag value={value} />, width: 100 },
    {
      title: 'Action',
      fixed: 'right',
      width: 190,
      render: (_, row) => (
        <Space>
          <Button type="link" onClick={() => startMedicine(row)}>Edit</Button>
          <Button type="link" onClick={() => startStock(row)}>Add Stock</Button>
        </Space>
      )
    }
  ];

  const saleColumns = [
    { title: 'Bill No', dataIndex: 'billNumber', width: 140 },
    { title: 'Type', dataIndex: 'saleType', width: 100 },
    { title: 'Patient/Customer', render: (_, row) => row.patient?.name || row.outsiderName || '-', width: 180 },
    { title: 'Date', dataIndex: 'date', render: formatDate, width: 110 },
    { title: 'Items', render: (_, row) => row.items?.length || 0, width: 90 },
    { title: 'Total', dataIndex: 'total', render: (value) => <CurrencyText value={value} />, width: 120 },
    { title: 'Paid', dataIndex: 'paidAmount', render: (value) => <CurrencyText value={value} />, width: 120 },
    { title: 'Balance', dataIndex: 'balanceAmount', render: (value) => <CurrencyText value={value} />, width: 120 },
    { title: 'Status', dataIndex: 'status', render: (value) => value === 'Credit' ? <Tag color="orange">Credit</Tag> : <StatusTag value={value} />, width: 110 },
    {
      title: 'Action',
      fixed: 'right',
      width: 120,
      render: (_, row) => row.status !== 'Cancelled' ? <ConfirmAction onConfirm={() => cancelSale(row)}>Cancel</ConfirmAction> : '-'
    }
  ];

  const orderColumns = [
    { title: 'Priority', render: (_, row) => priorityTag(row.stockPriority), width: 110 },
    { title: 'Medicine', dataIndex: 'marketName', width: 180 },
    { title: 'Composition', dataIndex: 'composition', width: 260 },
    { title: 'Current Stock', render: (_, row) => `${row.stockQty || 0} ${row.unit || ''}`, width: 120 },
    { title: 'Reorder Level', dataIndex: 'reorderLevel', width: 120 },
    { title: 'Reason', render: (_, row) => row.stockPriority?.reason, width: 220 },
    { title: 'Supplier', dataIndex: 'supplier', width: 160 }
  ];

  const compositionColumns = [
    { title: 'Composition', dataIndex: 'composition', width: 260 },
    { title: 'Available Market Names', render: (_, row) => (row.marketNames || []).join(', '), width: 420 },
    { title: 'Total Stock', dataIndex: 'totalStock', width: 120 },
    { title: 'Brands', dataIndex: 'medicineCount', width: 100 }
  ];

  const totals = dashboard?.totals || {};

  return (
    <>
      <PageHeader
        title="Medical Store"
        subtitle="Manage medicine stock, composition-wise alternatives, automatic reorder priorities and IPD/outsider medicine bills."
        extra={<Space wrap><Button icon={<FiRefreshCcw />} onClick={load}>Refresh</Button><Button type="primary" icon={<FiPlus />} onClick={() => startMedicine()}>Add Medicine</Button></Space>}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} sm={12} lg={6}><StatCard title="Total Medicines" value={totals.totalMedicines} prefix={<FiPackage />} loading={loading} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Out of Stock" value={totals.outOfStock} prefix={<FiPackage />} loading={loading} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Below 5 Stock" value={totals.belowFive} prefix={<FiPackage />} loading={loading} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Today Medicine Sale" value={totals.todayMedicineRevenue} prefix="₹" loading={loading} /></Col>
      </Row>

      <Tabs
        defaultActiveKey="billing"
        items={[
          {
            key: 'billing',
            label: 'Medicine Billing',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={9}>
                  <Card className="page-card" title={<Space><FiShoppingCart /> Generate Medicine Bill</Space>}>
                    <Alert
                      type="info"
                      showIcon
                      style={{ marginBottom: 14 }}
                      message="IPD bill select karne par medicine amount admitted patient ke running IPD bill mein add ho jayega. Outsider bill normal medicine invoice banayega."
                    />
                    <Form form={saleForm} layout="vertical" onFinish={createSale} initialValues={{ saleType: 'Outsider', date: dayjs(), paymentMode: 'Cash', items: [{}] }}>
                      <Form.Item name="saleType" label="Bill Type" rules={[{ required: true }]}>
                        <Select options={[{ label: 'Admitted Patient (IPD)', value: 'IPD' }, { label: 'Outsider Patient/Customer', value: 'Outsider' }]} />
                      </Form.Item>
                      <Form.Item noStyle shouldUpdate={(prev, cur) => prev.saleType !== cur.saleType}>
                        {({ getFieldValue }) => getFieldValue('saleType') === 'IPD' ? (
                          <Form.Item name="admission" label="Admission" rules={[{ required: true, message: 'Select admission' }]}>
                            <Select
                              showSearch
                              optionFilterProp="label"
                              options={admissions.filter((a) => !['Discharged', 'Cancelled'].includes(a.status)).map((a) => ({ label: `${a.admissionNumber} - ${a.patient?.name || ''}`, value: a._id }))}
                            />
                          </Form.Item>
                        ) : (
                          <>
                            <Form.Item name="outsiderName" label="Outsider Patient/Customer Name" rules={[{ required: true, message: 'Enter customer name' }]}><Input /></Form.Item>
                            <Form.Item name="outsiderMobile" label="Mobile"><Input /></Form.Item>
                          </>
                        )}
                      </Form.Item>
                      <Form.Item name="date" label="Bill Date"><DatePicker style={{ width: '100%' }} /></Form.Item>
                      <Form.List name="items">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <Card size="small" key={key} style={{ marginBottom: 10 }}>
                                <Form.Item {...restField} name={[name, 'medicine']} label="Medicine" rules={[{ required: true }]}>
                                  <Select showSearch optionFilterProp="label" options={medicineOptions} />
                                </Form.Item>
                                <Row gutter={8}>
                                  <Col span={8}><Form.Item {...restField} name={[name, 'quantity']} label="Qty" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
                                  <Col span={8}><Form.Item {...restField} name={[name, 'rate']} label="Rate"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                                  <Col span={8}><Form.Item {...restField} name={[name, 'discount']} label="Disc."><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                                </Row>
                                {fields.length > 1 && <Button danger type="link" onClick={() => remove(name)}>Remove Item</Button>}
                              </Card>
                            ))}
                            <Button block onClick={() => add({})}>Add Another Medicine</Button>
                          </>
                        )}
                      </Form.List>
                      <Divider />
                      <Row gutter={8}>
                        <Col span={12}><Form.Item name="discount" label="Bill Discount"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="tax" label="Bill Tax"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="paidAmount" label="Paid Amount"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="paymentMode" label="Payment Mode"><Select options={paymentOptions} /></Form.Item></Col>
                      </Row>
                      <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
                      <Button type="primary" htmlType="submit" loading={saving} block>Generate Bill & Deduct Stock</Button>
                    </Form>
                  </Card>
                </Col>
                <Col xs={24} lg={15}>
                  <SearchFilterBar search={saleSearch} setSearch={setSaleSearch} onRefresh={load} />
                  <DataTable columns={saleColumns} data={sales} loading={loading} scrollX={1250} />
                </Col>
              </Row>
            )
          },
          {
            key: 'stock',
            label: 'Medicine Stock',
            children: (
              <>
                <SearchFilterBar
                  search={medicineSearch}
                  setSearch={setMedicineSearch}
                  onRefresh={load}
                  filters={[
                    {
                      key: 'quick',
                      placeholder: 'Quick stock filter',
                      options: [
                        { label: 'Out of stock', value: 'out' },
                        { label: 'Less than 5', value: 'below5' },
                        { label: 'Less than 10', value: 'below10' }
                      ],
                      onChange: async (value) => {
                        setLoading(true);
                        try {
                          const { data } = await api.get('/medical-store/medicines', { params: { search: medicineSearch, stockFilter: value } });
                          setMedicines(data.data || []);
                        } finally {
                          setLoading(false);
                        }
                      }
                    }
                  ]}
                />
                <DataTable columns={medicineColumns} data={medicines} loading={loading} scrollX={1700} />
              </>
            )
          },
          {
            key: 'composition',
            label: 'Composition Finder',
            children: (
              <Card className="page-card">
                <Typography.Paragraph>
                  Same composition ke andar available market-name medicines aur total stock yahan se check kar sakte ho.
                </Typography.Paragraph>
                <Input.Search
                  allowClear
                  placeholder="Search composition, e.g. Paracetamol 500mg"
                  value={compositionSearch}
                  onChange={(e) => setCompositionSearch(e.target.value)}
                  style={{ maxWidth: 420, marginBottom: 16 }}
                />
                <Table rowKey="composition" columns={compositionColumns} dataSource={compositionRows} loading={loading} scroll={{ x: 900 }} />
              </Card>
            )
          },
          {
            key: 'ordering',
            label: 'Auto Ordering Priority',
            children: (
              <Card className="page-card">
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Priority rule: Out of stock = Immediate, stock less than 5 = High, stock less than 10 = Medium, stock below reorder level = Low."
                />
                <Table rowKey="_id" columns={orderColumns} dataSource={dashboard?.orderSuggestions || []} loading={loading} scroll={{ x: 1100 }} />
              </Card>
            )
          }
        ]}
      />

      <FormDrawer title={editingMedicine ? 'Edit Medicine' : 'Add Medicine'} open={medicineOpen} onClose={() => setMedicineOpen(false)} onSubmit={saveMedicine} form={medicineForm} loading={saving} width={720}>
        <Row gutter={12}>
          <Col xs={24} md={12}><Form.Item name="marketName" label="Market Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="genericName" label="Generic Name"><Input /></Form.Item></Col>
          <Col xs={24}><Form.Item name="composition" label="Composition" rules={[{ required: true }]}><Input placeholder="Example: Paracetamol 500mg" /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="strength" label="Strength"><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="dosageForm" label="Dosage Form" initialValue="Tablet"><Select options={dosageOptions} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="company" label="Company"><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="batchNo" label="Batch No"><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="expiryDate" label="Expiry Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="unit" label="Unit" initialValue="pcs"><Input /></Form.Item></Col>
          {!editingMedicine && <Col xs={24} md={8}><Form.Item name="stockQty" label="Opening Stock" initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>}
          <Col xs={24} md={8}><Form.Item name="purchaseRate" label="Purchase Rate"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="mrp" label="MRP"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="saleRate" label="Sale Rate"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="reorderLevel" label="Reorder Level" initialValue={10}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="supplier" label="Supplier"><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="rackNo" label="Rack No"><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="status" label="Status" initialValue="Active"><Select options={['Active', 'Inactive'].map((value) => ({ label: value, value }))} /></Form.Item></Col>
        </Row>
      </FormDrawer>

      <FormDrawer title={`Add Stock${stockMedicine ? ` - ${stockMedicine.marketName}` : ''}`} open={stockOpen} onClose={() => setStockOpen(false)} onSubmit={saveStock} form={stockForm} loading={saving} width={620}>
        <Alert type="info" showIcon style={{ marginBottom: 14 }} message={`Current stock: ${stockMedicine?.stockQty || 0} ${stockMedicine?.unit || ''}`} />
        <Form.Item name="quantity" label="Add Quantity" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
        <Row gutter={12}>
          <Col xs={24} md={12}><Form.Item name="purchaseRate" label="Purchase Rate"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="mrp" label="MRP"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="saleRate" label="Sale Rate"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="reorderLevel" label="Reorder Level"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="batchNo" label="Batch No"><Input /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="expiryDate" label="Expiry Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="supplier" label="Supplier"><Input /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="rackNo" label="Rack No"><Input /></Form.Item></Col>
        </Row>
        <Form.Item name="note" label="Note"><Input.TextArea rows={2} /></Form.Item>
      </FormDrawer>
    </>
  );
}
