import { Upload } from 'antd';
import React from 'react';
import { InboxOutlined } from '@ant-design/icons';

export default function UploadBox({ name = 'file', multiple = false }) {
  return (
    <Upload.Dragger name={name} multiple={multiple} beforeUpload={() => false} maxCount={multiple ? 5 : 1}>
      <p className="ant-upload-drag-icon"><InboxOutlined /></p>
      <p className="ant-upload-text">Click or drag file to upload</p>
      <p className="ant-upload-hint">Images, PDF, DOC and DOCX up to 5MB.</p>
    </Upload.Dragger>
  );
}
