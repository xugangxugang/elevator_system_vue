<template>
  <div>
    <el-card>
      <template #header>
        <h1>{{ resourceName }} 管理</h1>
      </template>
      <el-row>
        <el-col :span="12">
          <el-input v-model="searchQuery" placeholder="搜索职员名称" @input="search" clearable />
        </el-col>
        <el-col :span="6">
          <el-button @click="exportData">导出数据</el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="addItem">新增职员</el-button>
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
        <el-form-item
          v-for="column in columns.filter(col => col.prop !== 'ID' && col.prop !== '创建时间')"
          :key="column.prop"
          :label="column.label"
          :prop="column.prop"
          :error="errors[column.prop]"
        >
          <el-input v-model="formData[column.prop as keyof StaffMember]" />
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

interface ApiResponse {
  data: StaffMember[];
  totalCount: number;
  totalPages: number;
}

const apiBaseUrl = 'http://localhost:3000/api';

const resource = ref('staff-members');
const resourceName = ref('公司_职员表');

const columns = ref([
  { prop: 'ID', label: 'ID' },
  { prop: '职员名称', label: '职员名称' },
  { prop: '职员身份证', label: '职员身份证' },
  { prop: '入职时间', label: '入职时间' },
  { prop: '离职时间', label: '离职时间' },
  { prop: '登入权限', label: '登入权限' },
  { prop: '登入密码', label: '登入密码' }, // 添加此行
  { prop: '创建时间', label: '创建时间' }
]);

const data = ref<StaffMember[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const dialogVisible = ref(false);
const formData = ref<StaffMember>({
  ID: '',
  职员名称: '',
  职员身份证: '',
  入职时间: '',
  离职时间: '',
  登入权限: '',
  登入密码: '',
  创建时间: ''
});
const dialogTitle = ref('');
const formRef = ref<InstanceType<typeof ElForm> | null>(null);
const errors = ref<Record<string, string>>({});

const rules = {
  '职员名称': [{ required: true, message: '职员名称不能为空', trigger: 'blur' }],
  '职员身份证': [{ required: true, message: '职员身份证不能为空', trigger: 'blur' }],
  '入职时间': [{ required: true, message: '入职时间不能为空', trigger: 'blur' }],
  '登入权限': [{ required: true, message: '登入权限不能为空', trigger: 'blur' }],
  '登入密码': [{ required: true, message: '登入密码不能为空', trigger: 'blur' }] // 添加此行
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

const editItem = (item: StaffMember) => {
  formData.value = { ...item };
  dialogVisible.value = true;
  dialogTitle.value = `编辑 ${resourceName.value}`;
  errors.value = {};
};

const addItem = () => {
  formData.value = {
    ID: '',
    职员名称: '',
    职员身份证: '',
    入职时间: '',
    离职时间: '',
    登入权限: '',
    登入密码: '',
    创建时间: new Date().toISOString()
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
        ...formData.value,
        创建时间: undefined
      });
    } else {
      await axios.post(`${apiBaseUrl}/${resource.value}/`, {
        ...formData.value,
        创建时间: undefined
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

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.error-message {
  margin-top: 20px;
}
</style>