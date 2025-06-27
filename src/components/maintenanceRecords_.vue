<template>
  <div>
    <el-card>
      <template #header>
        <h1>{{ resourceName }} 管理</h1>
      </template>
      <el-row>
        <!-- 查询表单保持不变 -->
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

      <!-- 新的菜单栏 -->
      <el-row>
        <el-col :span="24">
          <el-button type="primary" @click="addItem">新增维保台账</el-button>
          <el-button @click="exportData">导出数据</el-button>
          <el-button type="danger" @click="deleteAllItems">删除所有记录</el-button>

          <!-- 批量添加提示框 -->
          <el-alert title="批量添加" type="info" description="支持Excel格式文件批量导入数据，请确保文件格式正确" show-icon />

          <el-upload class="custom-upload" drag auto-upload :action="`${apiBaseUrl}/api/maintenanceRecords/import`"
            :multiple="false" :headers="headers" :before-upload="beforeUpload" :on-success="handleUploadSuccess"
            :on-error="handleUploadError" :on-progress="handleUploadProgress" accept=".xlsx,.xls" name="file">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
            <el-progress v-if="uploadProgress" :percentage="uploadProgress" style="margin-top: 10px;" />
          </el-upload>
        </el-col>
      </el-row>

      <el-table :data="data" stripe>
        <!-- 动态生成表格列，排除ID列 -->
        <el-table-column v-for="(column, index) in columns.filter(col => col.prop !== 'ID')" :key="index"
          :prop="column.prop" :label="column.label" resizable :width="getCustomWidth(column.prop)">
          <template #default="scope">
            <!-- 检查是否是日期字段 -->
            <span v-if="['电梯添加日期', '制动实验检验日期', '限速器校验日期', '年检日期', '免保到期日期', '维保结束日期', '停保日期'].includes(column.prop)">
              {{ formatDate(scope.row[column.prop]) }}
            </span>
            <span v-else>
              {{ scope.row[column.prop] }}
            </span>
          </template>
        </el-table-column>

        <!-- 固定宽度的操作列 -->
        <el-table-column label="操作" fixed="right" width="600" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" @click="generateElevatorInfoReport(scope.row.ID)">
              <i class="el-icon-document"></i> 生成电梯基本情况表
            </el-button>
            <el-button size="small" type="success" @click="generateContract(scope.row.ID)">
              <i class="el-icon-document"></i> 生成维保合同证明
            </el-button>
            <el-button size="small" type="warning" @click="generateInspectionReport(scope.row.ID)">
              <i class="el-icon-check"></i> 生成自检报告
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

    <!-- Dialog 部分保持不变 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form :model="formData" label-width="120px" :rules="rules" ref="formRef">
        <!-- 补充表单内容 -->
        <el-form-item label="年份" prop="年份">
          <el-input v-model="formData.年份" />
        </el-form-item>
        <el-form-item label="台账编号" prop="台账编号">
          <el-input v-model="formData.台账编号" />
        </el-form-item>
        <el-form-item label="电梯添加日期" prop="电梯添加日期">
          <el-date-picker v-model="formData.电梯添加日期" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="使用单位名称" prop="使用单位名称">
          <el-input v-model="formData.使用单位名称" />
        </el-form-item>
        <el-form-item label="电梯所在地址" prop="电梯所在地址">
          <el-input v-model="formData.电梯所在地址" />
        </el-form-item>
        <el-form-item label="联系人" prop="联系人">
          <el-input v-model="formData.联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="联系电话">
          <el-input v-model="formData.联系电话" />
        </el-form-item>
        <el-form-item label="注册代码" prop="注册代码">
          <el-input v-model="formData.注册代码" />
        </el-form-item>
        <el-form-item label="出厂编号" prop="出厂编号">
          <el-input v-model="formData.出厂编号" />
        </el-form-item>
        <el-form-item label="CT码" prop="CT码">
          <el-input v-model="formData.CT码" />
        </el-form-item>
        <el-form-item label="制动实验检验日期" prop="制动实验检验日期">
          <el-date-picker v-model="formData.制动实验检验日期" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="限速器校验日期" prop="限速器校验日期">
          <el-date-picker v-model="formData.限速器校验日期" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="年检日期" prop="年检日期">
          <el-date-picker v-model="formData.年检日期" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="免保到期日期" prop="免保到期日期">
          <el-date-picker v-model="formData.免保到期日期" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="维保结束日期" prop="维保结束日期">
          <el-date-picker v-model="formData.维保结束日期" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="维保员组员" prop="维保员组员">
          <el-input v-model="formData.维保员组员" />
        </el-form-item>
        <el-form-item label="区域" prop="区域">
          <el-input v-model="formData.区域" />
        </el-form-item>
        <el-form-item label="月份" prop="月份">
          <el-input v-model="formData.月份" />
        </el-form-item>
        <el-form-item label="收款情况" prop="收款情况">
          <el-input v-model="formData.收款情况" />
        </el-form-item>
        <el-form-item label="停保日期" prop="停保日期">
          <el-date-picker v-model="formData.停保日期" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="金额" prop="金额">
          <el-input v-model="formData.金额" />
        </el-form-item>
        <el-form-item label="档案编号" prop="档案编号">
          <el-input v-model="formData.档案编号" />
        </el-form-item>
        <el-form-item label="是否北菱电梯" prop="是不是北菱电梯">
          <el-radio-group v-model="formData.是不是北菱电梯">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
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
import { ElForm, ElMessage } from 'element-plus';
import debounce from 'lodash/debounce';
import { io } from 'socket.io-client';

// 连接WebSocket，监听导入进度和结果
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
  年份: string;
  台账编号: string;
  电梯添加日期: string;
  使用单位名称: string;
  电梯所在地址: string;
  联系人: string;
  联系电话: string;
  注册代码: string;
  出厂编号: string;
  CT码: string;
  制动实验检验日期: string;
  限速器校验日期: string;
  年检日期: string;
  免保到期日期: string;
  维保结束日期: string;
  维保员组员: string;
  区域: string;
  月份: string;
  收款情况: string;
  停保日期: string;
  金额: string;
  档案编号: string;
  是不是北菱电梯: string;
  [key: string]: string | undefined;
}

interface Column {
  prop: string;
  label: string;
}

// 配置和状态
const apiBaseUrl = 'http://localhost:3000';
const resource = ref('maintenanceRecords');
const resourceName = ref('维保台账表');
const columns = ref<Column[]>([
  { prop: 'ID', label: 'ID' },
  { prop: '年份', label: '年份' },
  { prop: '台账编号', label: '台账编号' },
  { prop: '电梯添加日期', label: '电梯添加日期' },
  { prop: '使用单位名称', label: '使用单位名称' },
  { prop: '电梯所在地址', label: '电梯所在地址' },
  { prop: '联系人', label: '联系人' },
  { prop: '联系电话', label: '联系电话' },
  { prop: '注册代码', label: '注册代码' },
  { prop: '出厂编号', label: '出厂编号' },
  { prop: 'CT码', label: 'CT码' },
  { prop: '制动实验检验日期', label: '制动实验检验日期' },
  { prop: '限速器校验日期', label: '限速器校验日期' },
  { prop: '年检日期', label: '年检日期' },
  { prop: '免保到期日期', label: '免保到期日期' },
  { prop: '维保结束日期', label: '维保结束日期' },
  { prop: '维保员组员', label: '维保员组员' },
  { prop: '区域', label: '区域' },
  { prop: '月份', label: '月份' },
  { prop: '收款情况', label: '收款情况' },
  { prop: '停保日期', label: '停保日期' },
  { prop: '金额', label: '金额' },
  { prop: '档案编号', label: '档案编号' },
  { prop: '是不是北菱电梯', label: '是否北菱电梯' },
]);

const data = ref<Resource[]>([]);
const queryConditions = ref<Record<string, string>>({});
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const dialogVisible = ref(false);
const formData = ref<Resource>({
  ID: '',
  年份: '',
  台账编号: '',
  电梯添加日期: '',
  使用单位名称: '',
  电梯所在地址: '',
  联系人: '',
  联系电话: '',
  注册代码: '',
  出厂编号: '',
  CT码: '',
  制动实验检验日期: '',
  限速器校验日期: '',
  年检日期: '',
  免保到期日期: '',
  维保结束日期: '',
  维保员组员: '',
  区域: '',
  月份: '',
  收款情况: '',
  停保日期: '',
  金额: '',
  档案编号: '',
  是不是北菱电梯: '',
});
const dialogTitle = ref('');
const formRef = ref<InstanceType<typeof ElForm>>();

const rules = {
  台账编号: [{ required: true, message: '台账编号不能为空', trigger: 'blur' }],
  使用单位名称: [{ required: true, message: '使用单位名称不能为空', trigger: 'blur' }],
};

const headers = ref({
  Authorization: 'Bearer ' + localStorage.getItem('token'),
});

const uploadProgress = ref(0);

// 日期格式化方法
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

const fetchData = async () => {
  try {
    const { page, limit, ...conditions } = queryConditions.value;
    const finalQueryConditions = {
      ...conditions,
      page: currentPage.value,
      limit: pageSize.value,
    };

    // 使用 URLSearchParams 构建查询字符串
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
    console.error('获取数据时出错:', error);
  }
};

// 分页和查询相关函数保持不变
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  fetchData();
};

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage;
  fetchData();
};

// 导出、编辑、新增、保存、删除相关函数保持不变
const exportData = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/${resource.value}/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `公司_维保台账总表.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('导出数据时出错:', error);
  }
};

const editItem = async (item: Resource) => {
  formData.value = { ...item };
  dialogVisible.value = true;
  dialogTitle.value = `编辑 ${resourceName.value}`;
};

const addItem = () => {
  formData.value = {
    ID: '',
    年份: '',
    台账编号: '',
    电梯添加日期: '',
    使用单位名称: '',
    电梯所在地址: '',
    联系人: '',
    联系电话: '',
    注册代码: '',
    出厂编号: '',
    CT码: '',
    制动实验检验日期: '',
    限速器校验日期: '',
    年检日期: '',
    免保到期日期: '',
    维保结束日期: '',
    维保员组员: '',
    区域: '',
    月份: '',
    收款情况: '',
    停保日期: '',
    金额: '',
    档案编号: '',
    是不是北菱电梯: '',
  };
  dialogVisible.value = true;
  dialogTitle.value = `新增 ${resourceName.value}`;
};

const saveForm = async () => {
  try {
    const isValid = await formRef.value?.validate();
    if (!isValid) return;
    if (formData.value.ID) {
      const { ID, ...rest } = formData.value;
      await axios.put(`${apiBaseUrl}/api/${resource.value}/${formData.value.ID}`, rest);
    } else {
      await axios.post(`${apiBaseUrl}/api/${resource.value}`, formData.value);
    }
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('保存数据时出错:', error);
  }
};

const deleteItem = async (id: string) => {
  if (confirm('确定要删除这条记录吗？')) {
    try {
      await axios.delete(`${apiBaseUrl}/api/${resource.value}/${id}`);
      fetchData();
    } catch (error) {
      console.error('删除数据时出错:', error);
    }
  }
};

// 批量上传相关函数保持不变
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
  if (confirm('确定要删除所有记录吗？此操作无法撤销。')) {
    try {
      axios.delete(`${apiBaseUrl}/api/${resource.value}/delete-all`);
      data.value = [];
      totalCount.value = 0;
      ElMessage.success('所有记录已删除');
    } catch (error) {
      console.error('删除所有记录时出错:', error);
      ElMessage.error('删除所有记录失败');
    }
  }
};

const generateElevatorInfoReport = async (id: string) => {
  try {
    const row = data.value.find(item => item.ID === id);
    if (!row) {
      ElMessage.error('未找到对应的电梯记录');
      return;
    }

    // 使用 POST 方法发送请求
    const response = await axios.post(
      `${apiBaseUrl}/api/maintenanceRecords/downloadElevatorBasicInformationFormWord`,
      { id: row.ID }, // 将 ID 作为请求体发送
      {
        responseType: 'blob', // 指定响应类型为 blob，以便处理文件下载
      }
    );

    const fileName = `${row.档案编号}_${row.使用单位名称}_${row.注册代码}_电梯基本情况表.docx`;
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success('电梯基本情况表生成成功，正在下载...');
  } catch (error) {
    console.error('生成电梯基本情况表失败:', error);
    ElMessage.error('生成电梯基本情况表失败');
  }
};

const getCustomWidth = (prop: string): string => {
  const wideColumns = [
    '台账编号',
    '电梯添加日期',
    '使用单位名称',
    '电梯所在地址',
    '联系人',
    '联系电话',
    '注册代码',
    '出厂编号',
    'CT码',
    '制动实验检验日期',
    '限速器校验日期',
    '年检日期',
    "免保到期日期",
    "维保结束日期",
  ];
  return wideColumns.includes(prop) ? '200px' : '';
};
// 新增功能：生成维保合同证明和生成自检报告
const generateContract = async (id: string) => {
  try {
    ElMessage.info('正在生成维保合同证明，请稍候...');
    const response = await axios.post(
      `${apiBaseUrl}/api/maintenanceRecords/generate-contract`,
      { id },
      {
        responseType: 'blob', // 指定响应类型为 blob
      }
    );

    const row = data.value.find(item => item.ID === id);
    if (!row) {
      ElMessage.error('未找到对应的维保记录');
      return;
    }

    const formattedDate = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-'); // 格式化日期并替换斜杠为短横线

    const fileName = `${row.档案编号}_${row.使用单位名称}_${row.注册代码}_${formattedDate}_维保合同.docx`;

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success('维保合同证明生成成功，正在下载...');
  } catch (error) {
    console.error('生成维保合同证明时出错:', error);
    ElMessage.error('生成维保合同证明失败');
  }
};

const generateInspectionReport = async (id: string) => {
  try {
    ElMessage.info('正在生成自检报告，请稍候...');
    const response = await axios.post(
      `${apiBaseUrl}/api/maintenanceRecords/generate-inspection-report`,
      { id },
      {
        responseType: 'blob', // 指定响应类型为 blob
      }
    );

    const row = data.value.find(item => item.ID === id);
    if (!row) {
      ElMessage.error('未找到对应的维保记录');
      return;
    }

    const formattedInspectionDate = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-'); // 格式化日期并替换斜杠为短横线
    const fileName = `${row.档案编号}_${row.使用单位名称}_${row.注册代码}_${formattedInspectionDate}_自检报告.docx`;

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success('自检报告生成成功，正在下载...');
  } catch (error) {
    console.error('生成自检报告时出错:', error);
    ElMessage.error('生成自检报告失败');
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
}

.custom-upload:hover {
  border-color: #66b1ff;
}
</style>