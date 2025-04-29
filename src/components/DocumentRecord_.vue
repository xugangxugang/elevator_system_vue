<template>
  <div>
    <el-card>
      <template #header>
        <h1>{{ resourceName }} 管理</h1>
      </template>
      <el-row>
        <el-col :span="12">
          <el-input v-model="searchQuery" placeholder="搜索文件名称" @input="search" clearable />
        </el-col>
        <el-col :span="6">
          <el-button @click="exportData">导出数据</el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="addItem">新增记录</el-button>
        </el-col>
      </el-row>
      <el-table :data="data" stripe>
        <el-table-column v-for="(column, index) in columns" :key="index" :prop="column.prop" :label="column.label" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="editItem(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteItem(scope.row.ID)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 30]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalCount"
      />
    </el-card>
    <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form :model="formData" label-width="120px" :rules="rules" ref="formRef">
        <el-form-item label="文件编号" prop="文件编号">
          <el-select v-model="formData.文件编号" placeholder="选择文件编号" @change="fetchFileDetails">
            <el-option
              v-for="file in fileOptions"
              :key="file.ID"
              :label="file.文件编号"
              :value="file.文件编号"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="文件名称" prop="文件名称">
          <el-input v-model="formData.文件名称" :readonly="true" />
        </el-form-item>
        <el-form-item label="版本年号" prop="版本年号">
          <el-input v-model="formData.版本年号" :readonly="true" />
        </el-form-item>
        <el-form-item label="分发号" prop="分发号">
          <el-input v-model="formData.分发号" :readonly="true" />
        </el-form-item>
        <el-form-item label="发放部门" prop="发放部门">
          <el-select v-model="formData.发放部门" placeholder="选择部门">
            <el-option
              v-for="department in departments"
              :key="department.ID"
              :label="department.部门名称"
              :value="department.部门名称"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="发放签收人" prop="发放签收人">
          <el-select v-model="formData.发放签收人" placeholder="选择签收人">
            <el-option
              v-for="staff in staffNames"
              :key="staff.ID"
              :label="staff.职员名称"
              :value="staff.职员名称"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-for="column in columns.filter(col => col.prop !== 'ID' && col.prop !== 'NO' && col.prop !== '文件编号' && col.prop !== '职员ID' && col.prop !== '文件名称' && col.prop !== '版本年号' && col.prop !== '分发号' && col.prop !== '发放部门' && col.prop !== '发放签收人') "
          :key="column.prop"
          :label="column.label"
          :prop="column.prop"
          :error="errors[column.prop]"
        >
          <el-input v-model="formData[column.prop as keyof DocumentRecord]" />
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

interface StaffMember {
  ID: string;
  职员名称: string;
  职员身份证: string;
  入职时间: string;
  离职时间: string;
  登入权限: string;
  登入密码?: string;
  创建时间?: string;
}

interface Department {
  ID: string;
  部门名称: string;
}

interface DocumentRecord {
  ID: string;
  文件编号: string;
  文件名称: string;
  版本年号: string;
  分发号: string;
  发放部门: string;
  发放签收人: string;
  签收日期: string;
  回收签收人: string;
  回收日期: string;
  备注: string;
  编制日期: string;
  编制人: string;
  NO: string;
  职员ID: string;
}

interface ApiResponse {
  data: DocumentRecord[];
  totalCount: number;
  totalPages: number;
}

const apiBaseUrl = 'http://localhost:3000/api';

const resource = ref('document-records');
const resourceName = ref('公司_文件发放回收登记表');

const columns = ref([
  { prop: 'ID', label: 'ID' },
  { prop: '文件编号', label: '文件编号' },
  { prop: '文件名称', label: '文件名称' },
  { prop: '版本年号', label: '版本年号' },
  { prop: '分发号', label: '分发号' },
  { prop: '发放部门', label: '发放部门' },
  { prop: '发放签收人', label: '发放签收人' },
  { prop: '签收日期', label: '签收日期' },
  { prop: '回收签收人', label: '回收签收人' },
  { prop: '回收日期', label: '回收日期' },
  { prop: '备注', label: '备注' },
  { prop: '编制日期', label: '编制日期' },
  { prop: '编制人', label: '编制人' },
  { prop: 'NO', label: 'NO' }
]);

const data = ref<DocumentRecord[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const dialogVisible = ref(false);
const formData = ref<DocumentRecord>({
  ID: '',
  文件编号: '',
  文件名称: '',
  版本年号: '',
  分发号: '',
  发放部门: '',
  发放签收人: '',
  签收日期: '',
  回收签收人: '',
  回收日期: '',
  备注: '',
  编制日期: '',
  编制人: '',
  NO: '',
  职员ID: ''
});
const dialogTitle = ref('');
const formRef = ref<InstanceType<typeof ElForm> | null>(null);
const errors = ref<Record<string, string>>({});

const staffNames = ref<StaffMember[]>([]);
const departments = ref<Department[]>([]);
const fileOptions = ref<DocumentRecord[]>([]);

const rules = {
  '文件编号': [{ required: true, message: '文件编号不能为空', trigger: 'blur' }],
  '文件名称': [{ required: true, message: '文件名称不能为空', trigger: 'blur' }],
  '版本年号': [{ required: true, message: '版本年号不能为空', trigger: 'blur' }],
  '职员ID': [{ required: true, message: '职员ID不能为空', trigger: 'change' }]
};

const fetchData = async () => {
  try {
    const response = await axios.get<ApiResponse>(`${apiBaseUrl}/${resource.value}`, {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        q: searchQuery.value
      }
    });

    data.value = response.data.data;
    totalCount.value = response.data.totalCount;
  } catch (error) {
    handleAxiosError(error);
  }
};

const fetchFileOptions = async () => {
  try {
    const response = await axios.get('/api/file-distributions', {
      params: {
        page: 1,
        limit: 1000,
        q: ''
      }
    });
    fileOptions.value = response.data.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const fetchDepartments = async () => {
  try {
    const response = await axios.get('/api/departments', {
      params: {
        page: 1,
        limit: 1000,
        q: ''
      }
    });
    departments.value = response.data.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const getStaffMemberInfo = async () => {
  try {
    const response = await axios.get('/api/staff-members', {
      params: {
        page: 1,
        limit: 1000,
        q: ''
      }
    });
    staffNames.value = response.data.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const search = () => {
  currentPage.value = 1;
  fetchData();
};

const exportData = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/${resource.value}/export`, {
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

const editItem = (item: DocumentRecord) => {
  formData.value = { ...item };
  dialogVisible.value = true;
  dialogTitle.value = `编辑 ${resourceName.value}`;
  errors.value = {};
};

const addItem = () => {
  formData.value = {
    ID: '',
    文件编号: '',
    文件名称: '',
    版本年号: '',
    分发号: '',
    发放部门: '',
    发放签收人: '',
    签收日期: '',
    回收签收人: '',
    回收日期: '',
    备注: '',
    编制日期: '',
    编制人: '',
    NO: '',
    职员ID: ''
  };
  dialogVisible.value = true;
  dialogTitle.value = `新增 ${resourceName.value}`;
  errors.value = {};
};

const saveForm = async () => {
  const form = formRef.value;
  if (!form) return;

  try {
    const isValid = await form.validate();
    if (!isValid) return;

    if (formData.value.ID) {
      await axios.put(`${apiBaseUrl}/${resource.value}/${formData.value.ID}`, {
        ...formData.value
      });
    } else {
      await axios.post(`${apiBaseUrl}/${resource.value}/`, {
        ...formData.value
      });
    }
    dialogVisible.value = false;
    fetchData();
    ElMessage.success('保存成功');
    errors.value = {};
  } catch (error) {
    handleAxiosError(error);
  }
};

const deleteItem = async (id: string) => {
  if (confirm('确定要删除这条记录吗？')) {
    try {
      await axios.delete(`${apiBaseUrl}/${resource.value}/${id}`);
      fetchData();
      ElMessage.success('删除成功');
    } catch (error) {
      handleAxiosError(error);
    }
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

const handleAxiosError = (error: any) => {
  if (error.response) {
    if (error.response.status === 400 && error.response.data.errors) {
      const errorMessages = error.response.data.errors.reduce((acc: Record<string, string>, errorItem: any) => {
        acc[errorItem.param] = errorItem.msg;
        return acc;
      }, {});
      errors.value = errorMessages;
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

const fetchFileDetails = async (fileNumber: string) => {
  try {
    const response = await axios.get('/api/file-distributions', {
      params: {
        q: fileNumber
      }
    });
    const file = response.data.data.find((item: DocumentRecord) => item.文件编号 === fileNumber);
    if (file) {
      formData.value.文件名称 = file.文件名称;
      formData.value.版本年号 = file.版本年号;
    }
  } catch (error) {
    handleAxiosError(error);
  }
};

onMounted(() => {
  fetchData();
  getStaffMemberInfo();
  fetchDepartments();
  fetchFileOptions();
});
</script>

<style scoped>
.error-message {
  margin-top: 20px;
}
</style>