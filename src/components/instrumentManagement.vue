<template>
  <div>
    <el-card>
      <template #header>
        <h1>公司仪器仪表管理表</h1>
      </template>
      <el-row>
        <el-col :span="12">
          <el-input v-model="searchQuery" placeholder="搜索仪器仪表名称或编号" @input="search" clearable />
        </el-col>
        <el-col :span="6">
          <el-button @click="exportData">导出数据</el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="addItem">新增仪器仪表</el-button>
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
      <el-form
        :model="formData"
        label-width="120px"
        ref="formRef"
        :rules="rules"
      >
        <el-form-item label="仪器仪表名称" prop="仪器仪表名称">
          <el-input v-model="formData.仪器仪表名称" placeholder="请输入仪器仪表名称" />
        </el-form-item>
        <el-form-item label="仪器仪表编号" prop="仪器仪表编号">
          <el-input v-model="formData.仪器仪表编号" placeholder="请输入仪器仪表编号" />
        </el-form-item>
        <el-form-item label="校验时间" prop="校验时间">
          <el-input v-model="formData.校验时间" placeholder="请输入校验时间" />
        </el-form-item>
        <el-form-item label="管理人" prop="管理人">
          <el-select
            v-model="formData.管理人"
            placeholder="请选择管理人"
            filterable
            remote
            :remote-method="searchStaff"
            loading-text="加载中..."
          >
            <el-option
              v-for="staff in staffList"
              :key="staff.ID"
              :label="`${staff.职员名称} - ${staff.部门名称} - ${staff.职位名称}`"
              :value="staff.ID"
            />
          </el-select>
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
import { ElForm } from 'element-plus';

// 定义接口
interface Resource {
  ID: string | number | null;
  '仪器仪表名称': string;
  '仪器仪表编号': string;
  '校验时间': string;
  '管理人': string | null;
  [key: string]: string | number | null | undefined; // 添加索引签名
}

interface Column {
  prop: string;
  label: string;
}

const apiBaseUrl = 'http://localhost:3000';

const resource = ref('instrumentManagement');
const resourceName = ref('公司仪器仪表管理表');

const columns = ref<Column[]>([
  { prop: 'ID', label: 'ID' },
  { prop: '仪器仪表名称', label: '仪器仪表名称' },
  { prop: '仪器仪表编号', label: '仪器仪表编号' },
  { prop: '校验时间', label: '校验时间' },
  { prop: '管理人', label: '管理人' }
]);
const data = ref<Resource[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const dialogVisible = ref(false);
const formData = ref<Resource>({
  ID: null,
  '仪器仪表名称': '',
  '仪器仪表编号': '',
  '校验时间': '',
  '管理人': null
});
const dialogTitle = ref('');
const formRef = ref<InstanceType<typeof ElForm>>();
const staffList = ref<Resource[]>([]);

const rules = {
  '仪器仪表名称': [{ required: true, message: '仪器仪表名称不能为空', trigger: 'blur' }],
  '仪器仪表编号': [{ required: true, message: '仪器仪表编号不能为空', trigger: 'blur' }],
  '校验时间': [{ required: true, message: '校验时间不能为空', trigger: 'blur' }],
  '管理人': [{ required: true, message: '管理人不能为空', trigger: 'blur' }]
};

const fetchData = async () => {
  try {
    const response = await axios.get<Record<string, any>>(`${apiBaseUrl}/api/${resource.value}`, {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        q: searchQuery.value
      }
    });
    data.value = response.data.data as Resource[];
    totalCount.value = response.data.totalCount;
  } catch (error) {
    console.error('获取数据时出错:', error);
  }
};

const search = () => {
  currentPage.value = 1;
  fetchData();
};

const exportData = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/${resource.value}/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${resourceName.value}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('导出数据时出错:', error);
  }
};

const fetchStaff = async (params?: any) => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/employees`, { params });
    staffList.value = response.data.data.map((item: any) => {
      return {
        ...item,
        部门名称: item.部门名称 || '未分配部门',
        职位名称: item.职位名称 || '未分配职位'
      };
    }) as Resource[];
  } catch (error) {
    console.error('获取职员数据时出错:', error);
  }
};

const searchStaff = async (query: string) => {
  if (query) {
    fetchStaff({
      q: query,
      page: 1,
      limit: 10
    });
  } else {
    fetchStaff();
  }
};

const editItem = (item: Resource) => {
  formData.value = { ...item };
  dialogTitle.value = `编辑 ${resourceName.value}`;
  dialogVisible.value = true;

  if (formData.value.管理人) {
    fetchStaff({ ID: formData.value.管理人 });
  }
};

const addItem = () => {
  formData.value = {
    ID: null,
    '仪器仪表名称': '',
    '仪器仪表编号': '',
    '校验时间': '',
    '管理人': null
  };
  dialogTitle.value = `新增 ${resourceName.value}`;
  dialogVisible.value = true;
};

const saveForm = async () => {
  try {
    const isValid = await formRef.value?.validate();

    if (!isValid) return;

    if (formData.value.ID) {
      await axios.put(`${apiBaseUrl}/api/${resource.value}/${formData.value.ID}`, formData.value);
    } else {
      await axios.post(`${apiBaseUrl}/api/${resource.value}`, formData.value);
    }
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('保存数据时出错:', error);
  }
};

const deleteItem = async (id: string | number) => {
  if (confirm('确定要删除这条记录吗？')) {
    try {
      await axios.delete(`${apiBaseUrl}/api/${resource.value}/${id}`);
      fetchData();
    } catch (error) {
      console.error('删除数据时出错:', error);
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

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* 可按需添加更多样式 */
</style>