<template>
  <div>
    <el-card>
      <template #header>
        <h1>{{ resourceName }} 管理</h1>
      </template>
      <el-row>
        <el-col :span="12">
          <el-input v-model="searchQuery" placeholder="搜索使用单位" @input="search" clearable />
        </el-col>
        <el-col :span="6">
          <el-button @click="exportData">导出数据</el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="addItem">新增电梯信息</el-button>
        </el-col>
      </el-row>
      <el-table
        :data="data"
        stripe
        style="width: 100%"
        height="400px"
      >
        <!-- 固定前四列 -->
        <el-table-column
          fixed
          prop="使用单位"
          label="使用单位"
          width="150"
        />
        <el-table-column
          fixed
          prop="产品编号"
          label="产品编号"
          width="120"
        />
        <el-table-column
          fixed
          prop="设备代码"
          label="设备代码"
          width="120"
        />
        <el-table-column
          fixed
          prop="额定载荷"
          label="额定载荷"
          width="120"
        />

        <!-- 剩余列 -->
        <el-table-column
          v-for="(column, index) in remainingColumns" 
        
          :key="index"
          :prop="column"
          :label="column"
          :width="getColumnWidth(column)"
        />

        <!-- 操作列 -->
        <el-table-column
          fixed="right"
          label="操作"
          width="200"
        >
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
      <el-form :model="formData" label-width="120px"  ref="formRef">
        <!-- 动态生成表单字段 -->
        <el-row :gutter="20">
          <el-col :span="12" v-for="(column, index) in displayedColumns" :key="index">
            <el-form-item :label="column" :prop="column" :rules="getRules(column)">
              <el-input v-model="formData[column]" :placeholder="`请输入${column}`" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { ElForm } from 'element-plus';

// 定义接口
interface Entity {
  ID: string;
  [key: string]: unknown;
}

interface Resource extends Entity {
  使用单位: string;
  产品编号: string;
  设备代码: string;
  额定载荷: string;
  楼层站门: string;
  额定速度: string;
  控制方式: string;
  编号99333: string;
  安全管理人员: string;
  安管人员电话: string;
  电梯所在地址: string;
  设备使用状态: string;
  设备登记状态: string;
  设备内部编号: string;
  CT编号: string;
  制造时间: string;
  是否个人: string;
  限速器型号: string;
  使用登记证编号: string;
  设备所在地点: string;
  名义宽度: string;
  提升高度: string;
  输送能力: string;
  使用区段长度: string;
  斜角度: string;
  制造单位: string;
  电梯型号: string;
  设备品种: string;
  
}

const apiBaseUrl = 'http://localhost:3000';

const resource = ref('elevatorInfo');
const resourceName = ref('电梯_基本信息表');
const columns = ref([
  'ID',
  '使用单位',
  '产品编号',
  '设备代码',
  '额定载荷',
  '楼层站门',
  '额定速度',
  '控制方式',
  '编号99333',
  '安全管理人员',
  '安管人员电话',
  '电梯所在地址',
  '设备使用状态',
  '设备登记状态',
  '设备内部编号',
  'CT编号',
  '制造时间',
  '是否个人',
  '限速器型号',
  '使用登记证编号',
  '设备所在地点',
  '名义宽度',
  '提升高度',
  '输送能力',
  '使用区段长度',
  '斜角度',
  '制造单位',
  '电梯型号',
  '设备品种',
  '创建时间'
]);
const data = ref<Resource[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const dialogVisible = ref(false);
const formData = ref<Resource>({
  ID: '',
  使用单位: '',
  产品编号: '',
  设备代码: '',
  额定载荷: '',
  楼层站门: '',
  额定速度: '',
  控制方式: '',
  编号99333: '',
  安全管理人员: '',
  安管人员电话: '',
  电梯所在地址: '',
  设备使用状态: '',
  设备登记状态: '',
  设备内部编号: '',
  CT编号: '',
  制造时间: '',
  是否个人: '',
  限速器型号: 'OX-240',
  使用登记证编号: '',
  设备所在地点: '',
  名义宽度: '',
  提升高度: '',
  输送能力: '',
  使用区段长度: '',
  斜角度: '',
  制造单位: '',
  电梯型号: '',
  设备品种: ''

});
const dialogTitle = ref('');
const formRef = ref<InstanceType<typeof ElForm>>();

// 计算需要显示的列（排除 ID 和 创建时间）
const displayedColumns = computed(() => {
  return columns.value.filter(column => !['ID', '创建时间'].includes(column));
});
// 计算剩余列（排除固定列）
const remainingColumns = computed(() => {
  const fixedColumns = ['使用单位', '产品编号', '设备代码', '额定载荷'];
  return columns.value.filter(column => !fixedColumns.includes(column));
});


// 获取列宽
const getColumnWidth = (column: string) => {
  const widthMap: Record<string, number> = {
    '楼层站门': 120,
    '额定速度': 120,
    '控制方式': 120,
    '编号99333': 120,
    '安全管理人员': 120,
    '安管人员电话': 120,
    '电梯所在地址': 300,
    '设备使用状态': 120,
    '设备登记状态': 120,
    '设备内部编号': 120,
    'CT编号': 120,
    '制造时间': 120,
    '是否个人': 120,
    '限速器型号': 120,
    '使用登记证编号': 120,
    '设备所在地点': 120,
    '名义宽度': 120,
    '提升高度': 120,
    '输送能力': 120,
    '使用区段长度': 120,
    '斜角度': 120,
    '制造单位': 120,
    '电梯型号': 120,
    '设备品种': 120,
    '创建时间': 120
  };
  return widthMap[column] || 120;
};

// 获取表单校验规则
const getRules = (column: string) => {
  const rulesMap: Record<string, any[]> = {
    使用单位: [{ required: true, message: '请输入使用单位', trigger: 'blur' }],
    产品编号: [{ required: true, message: '请输入产品编号', trigger: 'blur' }],
    设备代码: [{ required: true, message: '请输入设备代码', trigger: 'blur' }]
  };
  return rulesMap[column] || [];
};

// 其余逻辑保持不变
const fetchData = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/${resource.value}`, {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        q: searchQuery.value
      }
    });
    data.value = response.data.data;
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

const editItem = async (item: Resource) => {
  formData.value = { ...item };
  dialogVisible.value = true;
  dialogTitle.value = `编辑 ${resourceName.value}`;
};

const addItem = () => {
  formData.value = {
    ID: '',
    使用单位: '',
    产品编号: '',
    设备代码: '',
    额定载荷: '',
    楼层站门: '',
    额定速度: '',
    控制方式: '',
    编号99333: '',
    安全管理人员: '',
    安管人员电话: '',
    电梯所在地址: '',
    设备使用状态: '',
    设备登记状态: '',
    设备内部编号: '',
    CT编号: '',
    制造时间: '',
    是否个人: '',
    限速器型号: 'OX-240',
    使用登记证编号: '',
    设备所在地点: '',
    名义宽度: '',
    提升高度: '',
    输送能力: '',
    使用区段长度: '',
    斜角度: '',
    制造单位: '',
    电梯型号: '',
    设备品种: ''

  };
  dialogVisible.value = true;
  dialogTitle.value = `新增 ${resourceName.value}`;
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
/* 样式部分保持不变 */
</style>