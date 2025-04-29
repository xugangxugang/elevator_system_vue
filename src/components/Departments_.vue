<template>
    <div>
      <el-card>
        <template #header>
          <h1>{{ resourceName }} 管理</h1>
        </template>
        <el-row>
          <el-col :span="12">
            <el-input v-model="searchQuery" placeholder="搜索部门名称" @input="search" clearable />
          </el-col>
          <el-col :span="6">
            <el-button @click="exportData">导出数据</el-button>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="addItem">新增部门</el-button>
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
          <el-form-item label="部门名称" prop="部门名称">
            <el-input v-model="formData.部门名称" />
          </el-form-item>
          <el-form-item label="部门职能" prop="部门职能">
            <el-input v-model="formData.部门职能" type="textarea" />
          </el-form-item>
          <el-form-item label="创建时间" prop="创建时间">
            <el-input v-model="formData.创建时间" :readonly="true" />
            <el-button type="primary" @click="getCurrentTime">获取当前时间</el-button>
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
  
  interface Department {
    ID: string;
    部门名称: string;
    部门职能: string;
    创建时间: string;
  }
  
  interface ApiResponse {
    data: Department[];
    totalCount: number;
    totalPages: number;
  }
  
  const apiBaseUrl = 'http://localhost:3000/api';
  
  const resource = ref('departments');
  const resourceName = ref('公司_部门表');
  
  const columns = ref([
    { prop: 'ID', label: 'ID' },
    { prop: '部门名称', label: '部门名称' },
    { prop: '部门职能', label: '部门职能' },
    { prop: '创建时间', label: '创建时间' }
  ]);
  
  const data = ref<Department[]>([]);
  const searchQuery = ref('');
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalCount = ref(0);
  const dialogVisible = ref(false);
  const formData = ref<Department>({
    ID: '',
    部门名称: '',
    部门职能: '',
    创建时间: new Date().toISOString()
  });
  const dialogTitle = ref('');
  const formRef = ref<InstanceType<typeof ElForm> | null>(null);
  const errors = ref<Record<string, string>>({});
  
  const rules = {
    '部门名称': [{ required: true, message: '部门名称不能为空', trigger: 'blur' }],
    '部门职能': [{ required: true, message: '部门职能不能为空', trigger: 'blur' }]
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
  
  const editItem = (item: Department) => {
    formData.value = { ...item };
    dialogVisible.value = true;
    dialogTitle.value = `编辑 ${resourceName.value}`;
    errors.value = {};
  };
  
  const addItem = () => {
    formData.value = {
      ID: '',
      部门名称: '',
      部门职能: '',
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
  
  const getCurrentTime = () => {
    formData.value.创建时间 = new Date().toISOString();
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