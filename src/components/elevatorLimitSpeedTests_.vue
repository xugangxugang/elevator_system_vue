<template>
  <div>
    <el-card>
      <template #header>
        <h1>{{ resourceName }} 管理</h1>
      </template>
      <el-row>
        <el-form :inline="true" @submit.prevent>
          <el-form-item label="校验日期">
  <el-date-picker v-model="queryConditions.校验日期" value-format="YYYY-MM-DD" type="date" placeholder="选择校验日期" />
</el-form-item>
<el-form-item label="设备代码">
  <el-input v-model="queryConditions.设备代码" placeholder="请输入设备代码" clearable />
</el-form-item>
<el-form-item label="使用单位">
  <el-input v-model="queryConditions.使用单位" placeholder="请输入使用单位" clearable />
</el-form-item>
    
        <el-form-item>
            <el-button type="primary" @click="fetchData">查询</el-button>
        </el-form-item>
    </el-form>
</el-row>
     
      <el-row>
        <el-col :span="24">
          <el-button type="primary" @click="addItem">新增校验记录</el-button>
          <el-button @click="exportData">导出数据</el-button>

          <!-- 批量上传区域 -->
          <el-alert title="批量添加" type="info" description="支持Excel格式文件批量导入数据，请确保文件格式正确" show-icon />

          <el-upload class="custom-upload" drag auto-upload :action="`${apiBaseUrl}/api/${resource}/import`"
            :multiple="false" :headers="headers" :before-upload="beforeUpload" :on-success="handleUploadSuccess"
            :on-error="handleUploadError" :on-progress="handleUploadProgress" accept=".xlsx,.xls" name="file">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
            <el-progress v-if="uploadProgress" :percentage="uploadProgress" style="margin-top: 10px;" />
          </el-upload>

          <!-- 添加删除所有记录按钮 -->
          <el-button type="danger" @click="deleteAllItems" style="margin-left: 10px;">
            删除所有记录
          </el-button>
        </el-col>
      </el-row>

      <el-table :data="data" stripe>
        <!-- 过滤掉包含'上行'、'下行'、'机械'、'电器'的列 -->
        <el-table-column v-for="(column, index) in columns.filter(col =>
          !['上行', '下行', '机械', '电器'].some(keyword => col.label.includes(keyword)) &&
          col.prop !== 'ID')" :key="index" :prop="column.prop" :label="column.label">
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="300px"> <!-- 设置操作列宽度 -->
          <template #default="scope">
            <!-- 新增生成限速器校验报告按钮 -->
            <el-button size="small" type="info" @click="generateLimitSpeedReport(scope.row.ID)">
              <i class="el-icon-document"></i> 生成限速器校验报告
            </el-button>
            <el-button size="small" @click="editItem(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteItem(scope.row.ID)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="currentPage"
        :page-sizes="[10, 20, 30]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper"
        :total="totalCount" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form :model="formData" label-width="120px" :rules="rules" ref="formRef">
        <el-form-item label="校验日期" prop="校验日期">
          <el-date-picker v-model="formData.校验日期" value-format="YYYY-MM-DD" type="date" placeholder="选择校验日期" />
        </el-form-item>
        <el-form-item label="设备代码" prop="设备代码">
          <el-input v-model="formData.设备代码" placeholder="请输入设备代码" @blur="fetchElevatorInfoByRegistrationCode" />
        </el-form-item>
        <el-form-item label="使用单位" prop="使用单位">
          <el-input v-model="formData.使用单位" placeholder="请输入使用单位" />
        </el-form-item>
        <el-form-item label="使用单位编号" prop="使用单位编号">
          <el-input v-model="formData.使用单位编号" placeholder="请输入使用单位编号" />
        </el-form-item>
        <el-form-item label="额定速度" prop="额定速度">
          <el-input v-model="formData.额定速度" placeholder="请输入额定速度" />
        </el-form-item>
        <el-form-item label="限速器型号" prop="限速器型号">
          <el-input v-model="formData.限速器型号" placeholder="请输入限速器型号" />
        </el-form-item>
        <el-form-item label="限速器产品编号" prop="限速器产品编号">
          <el-input v-model="formData.限速器产品编号" placeholder="请输入限速器产品编号" />
        </el-form-item>
        <el-form-item label="安全钳名称" prop="安全钳名称">
          <el-input v-model="formData.安全钳名称" placeholder="请输入安全钳名称" />
        </el-form-item>
        <el-form-item label="校验仪器编号" prop="校验仪器编号">
          <el-input v-model="formData.校验仪器编号" placeholder="请输入校验仪器编号" />
        </el-form-item>
        <el-form-item label="校验仪器名称" prop="校验仪器名称">
          <el-input v-model="formData.校验仪器名称" placeholder="请输入校验仪器名称" />
        </el-form-item>
        <el-form-item label="电器上行速度1" prop="电器上行速度1">
          <el-input v-model="formData.电器上行速度1" placeholder="请输入电器上行速度1" />
        </el-form-item>
        <el-form-item label="电器上行速度2" prop="电器上行速度2">
          <el-input v-model="formData.电器上行速度2" placeholder="请输入电器上行速度2" />
        </el-form-item>
        <el-form-item label="电器上行速度3" prop="电器上行速度3">
          <el-input v-model="formData.电器上行速度3" placeholder="请输入电器上行速度3" />
        </el-form-item>
        <el-form-item label="电器下行速度1" prop="电器下行速度1">
          <el-input v-model="formData.电器下行速度1" placeholder="请输入电器下行速度1" />
        </el-form-item>
        <el-form-item label="电器下行速度2" prop="电器下行速度2">
          <el-input v-model="formData.电器下行速度2" placeholder="请输入电器下行速度2" />
        </el-form-item>
        <el-form-item label="电器下行速度3" prop="电器下行速度3">
          <el-input v-model="formData.电器下行速度3" placeholder="请输入电器下行速度3" />
        </el-form-item>

        <el-form-item label="机械下行速度1" prop="机械下行速度1">
          <el-input v-model="formData.机械下行速度1" placeholder="请输入机械下行速度1" />
        </el-form-item>
        <el-form-item label="机械下行速度2" prop="机械下行速度2">
          <el-input v-model="formData.机械下行速度2" placeholder="请输入机械下行速度2" />
        </el-form-item>
        <el-form-item label="机械下行速度3" prop="机械下行速度3">
          <el-input v-model="formData.机械下行速度3" placeholder="请输入机械下行速度3" />
        </el-form-item>

        <el-form-item label="机械上行速度1" prop="机械上行速度1">
          <el-input v-model="formData.机械上行速度1" placeholder="请输入机械上行速度1" />
        </el-form-item>
        <el-form-item label="机械上行速度2" prop="机械上行速度2">
          <el-input v-model="formData.机械上行速度2" placeholder="请输入机械上行速度2" />
        </el-form-item>
        <el-form-item label="机械上行速度3" prop="机械上行速度3">
          <el-input v-model="formData.机械上行速度3" placeholder="请输入机械上行速度3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import { io } from 'socket.io-client';

// WebSocket连接，监听导入进度和结果
const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  withCredentials: true
});
socket.on('importProgress', (data) => {
  uploadProgress.value = data.progress;
});
socket.on('importSuccess', (data) => {
  ElMessage.success(data.message + '，共添加了 ' + data.recordsCount + ' 条记录');
  fetchData();
});

// 定义数据接口
interface Resource {
  ID: string;
  校验日期: string;
  设备代码: string;
  使用单位: string;
  使用单位编号: string;
  限速器型号: string;
  额定速度: string;
  限速器产品编号: string;
  安全钳名称: string;
  校验仪器编号: string;
  校验仪器名称: string;
  电器上行速度1: string;
  电器上行速度2: string;
  电器上行速度3: string;
  电器下行速度1: string;
  电器下行速度2: string;
  电器下行速度3: string;
  机械上行速度1: string;
  机械上行速度2: string;
  机械上行速度3: string;
  机械下行速度1: string;
  机械下行速度2: string;
  机械下行速度3: string;
}

interface Column {
  prop: string;
  label: string;
}

// 配置和状态
const apiBaseUrl = 'http://localhost:3000';
const resource = ref('elevatorLimitSpeedTests');
const resourceName = ref('电梯_限速器校验表');
const headers = ref({
  Authorization: 'Bearer ' + localStorage.getItem('token'),
});

const columns = ref<Column[]>([
  { prop: 'ID', label: 'ID' },
  { prop: '编号', label: '编号' },
  { prop: '校验日期', label: '校验日期' },
  { prop: '设备代码', label: '设备代码' },
  { prop: '使用单位', label: '使用单位' },
  { prop: '使用单位编号', label: '使用单位编号' },
  { prop: '额定速度', label: '额定速度' },
  { prop: '限速器型号', label: '限速器型号' },
  { prop: '限速器产品编号', label: '限速器产品编号' },
  { prop: '安全钳名称', label: '安全钳名称' },
  { prop: '校验仪器编号', label: '校验仪器编号' },
  { prop: '校验仪器名称', label: '校验仪器名称' },
  { prop: '电器上行速度1', label: '电器上行速度1' },
  { prop: '电器上行速度2', label: '电器上行速度2' },
  { prop: '电器上行速度3', label: '电器上行速度3' },
  { prop: '电器下行速度1', label: '电器下行速度1' },
  { prop: '电器下行速度2', label: '电器下行速度2' },
  { prop: '电器下行速度3', label: '电器下行速度3' },
  { prop: '机械上行速度1', label: '机械上行速度1' },
  { prop: '机械上行速度2', label: '机械上行速度2' },
  { prop: '机械上行速度3', label: '机械上行速度3' },
  { prop: '机械下行速度1', label: '机械下行速度1' },
  { prop: '机械下行速度2', label: '机械下行速度2' },
  { prop: '机械下行速度3', label: '机械下行速度3' },
]);

const data = ref<Resource[]>([]);
const queryConditions = ref<Record<string, string>>({});
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const dialogVisible = ref(false);
const formData = ref<Resource>({
  ID: '',
  校验日期: '',
  设备代码: '',
  使用单位: '',
  使用单位编号: '',
  额定速度: '',
  限速器产品编号: '',
  限速器型号: 'OX-240', // 默认值
  安全钳名称: '',
  校验仪器编号: '',
  校验仪器名称: '',
  电器上行速度1: '',
  电器上行速度2: '',
  电器上行速度3: '',
  电器下行速度1: '',
  电器下行速度2: '',
  电器下行速度3: '',
  机械上行速度1: '',
  机械上行速度2: '',
  机械上行速度3: '',
  机械下行速度1: '',
  机械下行速度2: '',
  机械下行速度3: ''
});

const dialogTitle = ref('');
const formRef = ref<InstanceType<typeof ElForm>>();
// 根据设备代码查询电梯信息
const fetchElevatorInfoByRegistrationCode = async () => {
  if (!formData.value.设备代码) return;

  try {
    const response = await axios.post(
      `${apiBaseUrl}/api/elevatorInfo/getByRegistrationCode`,
      { 设备代码: formData.value.设备代码 }
    );
    const elevatorInfo = response.data.data;

    if (elevatorInfo) {
      formData.value.额定速度 = elevatorInfo.额定速度;
      formData.value.限速器产品编号 = elevatorInfo.产品编号; // 假设后端返回的电梯信息中有产品编号字段
      formData.value.使用单位 = elevatorInfo.使用单位 || formData.value.使用单位;
      formData.value.使用单位编号 = elevatorInfo.使用单位编号 || formData.value.使用单位编号;
      formData.value.安全钳名称 = elevatorInfo.安全钳名称 || '渐进式安全钳';
      formData.value.校验仪器编号 = elevatorInfo.校验仪器编号 || 'FC812579';
      formData.value.校验仪器名称 = elevatorInfo.校验仪器名称 || '电梯限速器测试仪';
      formData.value.限速器型号 = elevatorInfo.限速器型号 || 'OX-240';
    }
  } catch (error) {
    console.error('获取电梯信息失败:', error);
    ElMessage.error('获取电梯信息失败');
  }
};

// 在addItem函数中不需要设置编号，由后端自动生成
const addItem = () => {
  formData.value = {
    ID: '',
    校验日期: '',
    设备代码: '',
    使用单位: '',
    使用单位编号: '',
    限速器型号: 'OX-240', // 默认值
    额定速度: '',
    限速器产品编号: '',
    安全钳名称: '',
    校验仪器编号: '',
    校验仪器名称: '',
    电器上行速度1: '',
    电器上行速度2: '',
    电器上行速度3: '',
    电器下行速度1: '',
    电器下行速度2: '',
    电器下行速度3: '',
    机械上行速度1: '',
    机械上行速度2: '',
    机械上行速度3: '',
    机械下行速度1: '',
    机械下行速度2: '',
    机械下行速度3: ''
  };
  dialogVisible.value = true;
  dialogTitle.value = `新增 ${resourceName.value}`;
};

// 确保编辑时显示之前的值
const editItem = async (item: Resource) => {
  formData.value = (await axios.get(`${apiBaseUrl}/api/${resource.value}/${item.ID}`)).data.data as Resource;
  dialogVisible.value = true;
  dialogTitle.value = `编辑 ${resourceName.value}`;
};

// 其他逻辑保持不变
const uploadProgress = ref(0);
const rules = {
  校验日期: [{ required: true, message: '校验日期不能为空', trigger: 'blur' }],
  设备代码: [{ required: true, message: '设备代码不能为空', trigger: 'blur' }],
  使用单位: [{ required: true, message: '使用单位不能为空', trigger: 'blur' }],

};

const fetchData = async () => {
  try {
    const { page, limit, ...conditions } = queryConditions.value;
    const finalQueryConditions = {
      ...conditions,
      page: currentPage.value,
      limit: pageSize.value,
    };

    const encodedParams = new URLSearchParams();
    for (const [key, value] of Object.entries(finalQueryConditions)) {
      if (value !== undefined && value !== null) {
        encodedParams.append(key, value.toString());
      }
    }

    const response = await axios.get(
      `${apiBaseUrl}/api/${resource.value}`,
      {
        params: encodedParams,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
    data.value = response.data.data as Resource[];
    totalCount.value = response.data.totalCount;
  } catch (error) {
    handleAxiosError(error);
  }
};

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  fetchData();
};

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage;
  fetchData();
};

const exportData = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/${resource.value}/export`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${resourceName.value}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    handleAxiosError(error);
  }
};

// 处理 Axios 错误
const handleAxiosError = (error: any) => {
  if (error.response) {
    if (error.response.status === 400 && error.response.data.errors) {
      const errorMessages = error.response.data.errors.reduce((acc: Record<string, string>, errorItem: any) => {
        acc[errorItem.param] = errorItem.msg;
        return acc;
      }, {} as Record<string, string>);
      ElMessageBox.alert(
        Object.values(errorMessages).join('<br>'),
        '表单验证失败',
        {
          confirmButtonText: '确定',
          type: 'error',
          dangerouslyUseHTMLString: true
        }
      );
    } else if (error.response.status === 400 && error.response.data.message) {
      ElMessageBox.alert(
        error.response.data.message,
        '错误',
        {
          confirmButtonText: '确定',
          type: 'error'
        }
      );
    } else {
      ElMessageBox.alert(
        error.response.data.message || '请求失败，请稍后再试',
        '错误',
        {
          confirmButtonText: '确定',
          type: 'error'
        }
      );
    }
  } else if (error.request) {
    ElMessageBox.alert(
      '无法连接到服务器，请检查网络',
      '错误',
      {
        confirmButtonText: '确定',
        type: 'error'
      }
    );
  } else {
    ElMessageBox.alert(
      error.message,
      '错误',
      {
        confirmButtonText: '确定',
        type: 'error'
      }
    );
  }
  console.error('请求出错:', error);
};

const saveForm = async () => {
  try {
    const isValid = await formRef.value?.validate();
    if (!isValid) return;
    if (formData.value.ID) {
      const { ID, ...rest } = formData.value;
      await axios.put(`${apiBaseUrl}/api/${resource.value}/${formData.value.ID}`, rest);
    } else {
      const payload = { ...formData.value };

      await axios.post(`${apiBaseUrl}/api/${resource.value}`, payload);
    }
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    handleAxiosError(error);
  }
};

const deleteItem = async (id: string) => {
  if (confirm('确定要删除这条记录吗？')) {
    try {
      await axios.delete(`${apiBaseUrl}/api/${resource.value}/${id}`);
      fetchData();
    } catch (error) {
      handleAxiosError(error);
    }
  }
};

// 批量上传相关函数
const beforeUpload = (file: File) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isExcel) {
    ElMessage.error('只能上传 Excel 文件');
    return false;
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB');
    return false;
  }
  return true;
};

const handleUploadSuccess = (response: { success: boolean; message?: string }, file: File) => {
  uploadProgress.value = 0;
  if (response.success) {
    ElMessage.success('文件上传成功');
    fetchData();
  } else {
    ElMessage.error('文件上传失败: ' + (response.message || '未知错误'));
  }
};

const handleUploadError = (err: Error, file: File) => {
  uploadProgress.value = 0;
  console.error('文件上传错误:', err);
  ElMessage.error('文件上传失败');
};

const handleUploadProgress = (event: ProgressEvent) => {
  if (event.lengthComputable) {
    uploadProgress.value = Math.round((event.loaded / event.total) * 100);
  }
};

// 删除所有记录
const deleteAllItems = () => {
  ElMessageBox.confirm(
    '确定要删除所有记录吗？此操作无法撤销。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await axios.delete(`${apiBaseUrl}/api/${resource.value}/delete-all`);
      data.value = [];
      totalCount.value = 0;
      ElMessage.success('所有记录已删除');
    } catch (error) {
      handleAxiosError(error);
    }
  }).catch(() => {
    ElMessage.info('已取消删除操作');
  });
};

// 新增生成限速器校验报告功能
const generateLimitSpeedReport = async (id: string) => {
  try {
    ElMessage.info('正在生成限速器校验报告，请稍候...');
    const response = await axios.post(
      `${apiBaseUrl}/api/elevatorLimitSpeedTests/generate-limit-speed-report`,
      { id },
      {
        responseType: 'blob', // 指定响应类型为 blob，以便处理文件下载
      }
    );

    // 查找对应的行数据，以获取使用单位名称和设备代码
    const row = data.value.find(item => item.ID === id);
    if (!row) {
      ElMessage.error('未找到对应的校验记录');
      return;
    }

    // 动态生成文件名
    const formattedDate = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-'); // 格式化日期并替换斜杠为短横线
    const fileName = `${row.使用单位}_${row.设备代码}_${formattedDate}_限速器校验报告.docx`;

    // 创建文件下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // 显示成功消息
    ElMessage.success('限速器校验报告生成成功，正在下载...');
  } catch (error) {
    console.error('生成限速器校验报告时出错:', error);
    ElMessage.error('生成限速器校验报告失败');
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.custom-upload {
  width: 500px;
  height: 100px;
  border: 2px dashed #409EFF;
  border-radius: 10px;
  background-color: #f5f7fa;
  padding: 20px;
  margin-top: 20px;
}

.custom-upload:hover {
  border-color: #66b1ff;
}
</style>