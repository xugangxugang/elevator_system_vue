<template>
  <div>
    <el-card>
      <template #header>
        <h1>{{ resourceName }} 管理</h1>
      </template>
      <el-row>
        <!-- 查询表单 -->
        <el-form :inline="true" @submit.prevent>
          <el-form-item v-for="(column, index) in columns.filter(col => col.prop !== 'ID')" :key="index"
            :label="column.label">
            <el-input v-model="queryConditions[column.prop]" placeholder="请输入查询条件" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchData">查询</el-button>
          </el-form-item>
        </el-form>
      </el-row>

      <!-- 操作按钮 -->
      <el-row>
        <el-col :span="24">
          <el-button type="primary" @click="addItem">新增统计记录</el-button>
          <el-button @click="exportData">导出数据</el-button>
          <el-button type="danger" @click="batchDeleteItems" :disabled="selectedIds.length === 0">批量删除</el-button>
          <el-button type="danger" @click="deleteAllItems">清空所有记录</el-button>

          <!-- 批量导入提示 -->
          <el-alert title="批量导入" type="info" description="支持Excel格式文件批量导入数据，请确保文件格式正确" show-icon />
          
          <el-upload class="custom-upload" drag auto-upload :action="`${apiBaseUrl}/api/maintenanceStatistics/import`"
            :multiple="false" :headers="headers" :before-upload="beforeUpload" :on-success="handleUploadSuccess"
            :on-error="handleUploadError" :on-progress="handleUploadProgress" accept=".xlsx,.xls" name="file">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
            <el-progress v-if="uploadProgress" :percentage="uploadProgress" style="margin-top: 10px;" />
          </el-upload>
        </el-col>
      </el-row>

      <!-- 表格 -->
      <el-table 
        :data="data" 
        stripe
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column v-for="(column, index) in columns.filter(col => col.prop !== 'ID')" :key="index"
          :prop="column.prop" :label="column.label" resizable :width="getCustomWidth(column.prop)">
          <template #default="scope">
            <!-- 格式化日期字段 -->
            <span v-if="['维保结束日期', '停保日期'].includes(column.prop)">
              {{ formatDate(scope.row[column.prop]) }}
            </span>
            <span v-else>
              {{ scope.row[column.prop] }}
            </span>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" fixed="right" width="200" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editItem(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteItem(scope.row.ID)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="currentPage"
        :page-sizes="[10, 20, 30]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper"
        :total="totalCount" />
    </el-card>

    <!-- 对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form :model="formData" label-width="120px" :rules="rules" ref="formRef">
        <el-form-item label="报表的年份月份" prop="报表的年份月份">
          <el-input v-model="formData['报表的年份月份']" placeholder="例如：2025年1月" />
        </el-form-item>
        <el-form-item label="年份" prop="年份">
          <el-input v-model="formData.年份" placeholder="例如：2025" />
        </el-form-item>
        <el-form-item label="台账编号" prop="台账编号">
          <el-input v-model="formData.台账编号" />
        </el-form-item>
        <el-form-item label="使用单位" prop="使用单位">
          <el-input v-model="formData.使用单位" />
        </el-form-item>
        <el-form-item label="注册代码" prop="注册代码">
          <el-input v-model="formData.注册代码" />
        </el-form-item>
        <el-form-item label="维保结束日期" prop="维保结束日期">
          <el-date-picker v-model="formData.维保结束日期" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="维保员组员" prop="维保员组员">
          <el-input v-model="formData.维保员组员" />
        </el-form-item>
        <el-form-item label="停保日期" prop="停保日期">
          <el-date-picker v-model="formData.停保日期" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="维保统计" prop="维保统计">
          <el-input-number v-model="formData.维保统计" :min="0" />
        </el-form-item>
        <el-form-item label="档案编号" prop="档案编号">
          <el-input v-model="formData.档案编号" />
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
import debounce from 'lodash/debounce';
import { io } from 'socket.io-client';

// WebSocket连接
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

// 数据接口定义
interface Resource {
  ID: number;
  '报表的年份月份': string;
  年份: string;
  台账编号: string;
  使用单位: string;
  注册代码: string;
  维保结束日期: string;
  维保员组员: string;
  停保日期: string;
  维保统计: number;
  档案编号: string;
}

interface Column {
  prop: string;
  label: string;
}

// 配置和状态
const apiBaseUrl = 'http://localhost:3000';
const resource = ref('maintenanceStatistics');
const resourceName = ref('电梯维保台账统计表');
const columns = ref<Column[]>([
  { prop: 'ID', label: 'ID' },
  { prop: '报表的年份月份', label: '报表的年份月份' },
  { prop: '年份', label: '年份' },
  { prop: '台账编号', label: '台账编号' },
  { prop: '使用单位', label: '使用单位' },
  { prop: '注册代码', label: '注册代码' },
  { prop: '维保结束日期', label: '维保结束日期' },
  { prop: '维保员组员', label: '维保员组员' },
  { prop: '停保日期', label: '停保日期' },
  { prop: '维保统计', label: '维保统计' },
  { prop: '档案编号', label: '档案编号' },
]);

const data = ref<Resource[]>([]);
const queryConditions = ref<Record<string, string>>({});
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const dialogVisible = ref(false);
const formData = ref<Resource>({
  ID: 0,
  '报表的年份月份': '',
  年份: '',
  台账编号: '',
  使用单位: '',
  注册代码: '',
  维保结束日期: '',
  维保员组员: '',
  停保日期: '',
  维保统计: 0,
  档案编号: ''
});
const dialogTitle = ref('');
const formRef = ref<InstanceType<typeof ElForm>>();

const rules = {
  '报表的年份月份': [{ required: true, message: '报表的年份月份不能为空', trigger: 'blur' }],
  台账编号: [{ required: true, message: '台账编号不能为空', trigger: 'blur' }],
  使用单位: [{ required: true, message: '使用单位不能为空', trigger: 'blur' }],
};

const headers = ref({
  Authorization: 'Bearer ' + localStorage.getItem('token'),
});

const uploadProgress = ref(0);
const selectedIds = ref<number[]>([]);

// 处理多选变化
const handleSelectionChange = (selection: Resource[]) => {
  selectedIds.value = selection.map(item => item.ID);
};

// 批量删除方法
const batchDeleteItems = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await axios.post(`${apiBaseUrl}/api/${resource.value}/delete_selected`, {
      ids: selectedIds.value
    });
    
    ElMessage.success('删除成功');
    selectedIds.value = [];
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      handleAxiosError(error);
    }
  }
};

// 日期格式化方法
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// 统一处理Axios错误的函数
const handleAxiosError = (error: any) => {
  if (error.response) {
    if (error.response.status === 400 && error.response.data.errors) {
      const errorMessages = error.response.data.errors.reduce((acc: Record<string, string>, errorItem: any) => {
        acc[errorItem.param] = errorItem.msg;
        return acc;
      }, {});
      // 使用ElMessageBox显示错误信息
      ElMessageBox.alert(
        Object.values(errorMessages).join('<br>'),
        '表单验证失败',
        {
          confirmButtonText: '确定',
          type: 'error',
          dangerouslyUseHTMLString: true
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

// 获取数据
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

    const response = await axios.get<Record<string, any>>(
      `${apiBaseUrl}/api/${resource.value}`,
      {
        params: encodedParams,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
    data.value = response.data.data;
    totalCount.value = response.data.totalCount;
  } catch (error) {
    handleAxiosError(error);
  }
};

// 分页处理
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  fetchData();
};

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage;
  fetchData();
};

// 导出数据
const exportData = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/${resource.value}/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `电梯维保台账统计表.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    handleAxiosError(error);
  }
};

// 编辑记录
const editItem = async (item: Resource) => {
  formData.value = { ...item };
  dialogVisible.value = true;
  dialogTitle.value = `编辑 ${resourceName.value}`;
};

// 新增记录
const addItem = () => {
  formData.value = {
    ID: 0,
    '报表的年份月份': '',
    年份: '',
    台账编号: '',
    使用单位: '',
    注册代码: '',
    维保结束日期: '',
    维保员组员: '',
    停保日期: '',
    维保统计: 0,
    档案编号: ''
  };
  dialogVisible.value = true;
  dialogTitle.value = `新增 ${resourceName.value}`;
};

// 保存表单
const saveForm = async () => {
  try {
    const isValid = await formRef.value?.validate();
    if (!isValid) return;

    // 格式化日期字段
    const formattedData = {
      ...formData.value,
      '维保结束日期': formatDateForBackend(formData.value['维保结束日期']),
      '停保日期': formatDateForBackend(formData.value['停保日期']),
    };

    let response;
    if (formattedData.ID) {
      // 更新现有记录
      const { ID, ...rest } = formattedData;
      response = await axios.put(`${apiBaseUrl}/api/${resource.value}/${formattedData.ID}`, rest);
    } else {
      // 创建新记录
      response = await axios.post(`${apiBaseUrl}/api/${resource.value}`, formattedData);
    }

    // 如果保存成功
    dialogVisible.value = false;
    fetchData();
    ElMessage.success('保存成功');
  } catch (error) {
    handleAxiosError(error);
  }
};

// 日期格式化函数
const formatDateForBackend = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// 删除记录
const deleteItem = async (id: number) => {
  if (confirm('确定要删除这条记录吗？')) {
    try {
      await axios.delete(`${apiBaseUrl}/api/${resource.value}/${id}`);
      fetchData();
    } catch (error) {
      handleAxiosError(error);
    }
  }
};

// 批量上传
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

// 修正后的错误处理函数
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
  if (confirm('确定要删除所有记录吗？此操作无法撤销。')) {
    try {
      axios.delete(`${apiBaseUrl}/api/${resource.value}/delete_all`).then(() => {
        data.value = [];
        totalCount.value = 0;
        ElMessage.success('所有记录已删除');
        fetchData(); // 刷新数据以反映删除
      }).catch((error) => {
        handleAxiosError(error);
      });
    } catch (error) {
      handleAxiosError(error);
    }
  }
};

// 获取自定义列宽
const getCustomWidth = (prop: string): string => {
  const wideColumns = [
    '报表的年份月份',
    '台账编号',
    '使用单位',
    '注册代码',
    '维保员组员',
    '档案编号'
  ];
  return wideColumns.includes(prop) ? '200px' : '';
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
}

.custom-upload:hover {
  border-color: #66b1ff;
}
</style>