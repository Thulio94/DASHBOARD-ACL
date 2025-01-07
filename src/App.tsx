import { useState, useEffect } from 'react'
import './App.css'
import { Download } from 'lucide-react'

// Importações do shadcn/ui
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select"
import { Input } from "./components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Button } from "./components/ui/button"

interface Cliente {
  DOCUMENTO_CLIENTE: string;
  NOME_CLIENTE: string;
  TIPO_MOVIMENTO: string;
  "ANO REFERENCIA": string;
  "MÊS REFERENCIA": string;
  "DIAS EM ATRASO": string;
  "CONTAGEM TOTAL DIAS EM ATRASOS": number;
  VALOR_FINAL: number;
  DATA_EVENTO: string;
  FATURA: string;
}

interface FaturaAgrupada {
  DOCUMENTO_CLIENTE: string;
  NOME_CLIENTE: string;
  "MÊS REFERENCIA": string;
  faturas: {
    [key: string]: number;
  };
}

const ITEMS_PER_PAGE = 20
const API_URL = 'https://script.google.com/macros/s/AKfycbzoSVceegec0Maq2EzGTcm9ba6kqOhFQ-y8ERURW_KpvpksZA9RvRbm0W3IQSIfbwZ4/exec'

function App() {
  const [data, setData] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMovementType, setSelectedMovementType] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Função para agrupar dados por cliente e fatura
  const agruparDadosPorFatura = (dados: Cliente[]): FaturaAgrupada[] => {
    const agrupado = dados.reduce((acc: { [key: string]: FaturaAgrupada }, item) => {
      const chave = `${item.DOCUMENTO_CLIENTE}-${item["MÊS REFERENCIA"]}`
      
      if (!acc[chave]) {
        acc[chave] = {
          DOCUMENTO_CLIENTE: item.DOCUMENTO_CLIENTE,
          NOME_CLIENTE: item.NOME_CLIENTE,
          "MÊS REFERENCIA": item["MÊS REFERENCIA"],
          faturas: {}
        }
      }
      
      if (item.FATURA !== undefined && ['0', '1', '2', '3'].includes(item.FATURA)) {
        acc[chave].faturas[item.FATURA] = (acc[chave].faturas[item.FATURA] || 0) + item.VALOR_FINAL
      }
      
      return acc
    }, {})

    return Object.values(agrupado)
  }

  // Função para formatar e validar os dados
  const formatData = (item: any): Cliente => ({
    DOCUMENTO_CLIENTE: String(item.DOCUMENTO_CLIENTE || ''),
    NOME_CLIENTE: String(item.NOME_CLIENTE || ''),
    TIPO_MOVIMENTO: String(item.TIPO_MOVIMENTO || ''),
    "ANO REFERENCIA": String(item["ANO REFERENCIA"] || ''),
    "MÊS REFERENCIA": String(item["MÊS REFERENCIA"] || ''),
    "DIAS EM ATRASO": String(item["DIAS EM ATRASO"] || ''),
    "CONTAGEM TOTAL DIAS EM ATRASOS": Number(item["CONTAGEM TOTAL DIAS EM ATRASOS"]) || 0,
    VALOR_FINAL: Number(item.VALOR_FINAL) || 0,
    DATA_EVENTO: String(item.DATA_EVENTO || ''),
    FATURA: String(item.FATURA || '')
  })

  // Carregar dados iniciais
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Adicionar parâmetros de paginação à URL
        const url = new URL(API_URL)
        url.searchParams.append('page', '1')
        url.searchParams.append('limit', '100')
        
        const response = await fetch(url.toString())
        
        if (!response.ok) {
          throw new Error('Erro ao carregar dados')
        }
        
        const jsonData = await response.json()
        
        // Transformar e validar os dados
        const formattedData = jsonData
          .map(formatData)
          .filter(item => item.VALOR_FINAL > 0 || item.DATA_EVENTO !== '')
        
        setData(formattedData)
        setHasMore(formattedData.length === 100) // Se recebemos 100 itens, provavelmente há mais
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        setError('Erro ao carregar dados. Por favor, tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  // Função para carregar mais dados
  const loadMoreData = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = Math.ceil(data.length / 100) + 1
      
      const url = new URL(API_URL)
      url.searchParams.append('page', nextPage.toString())
      url.searchParams.append('limit', '100')
      
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error('Erro ao carregar mais dados')
      }
      
      const jsonData = await response.json()
      
      const newData = jsonData
        .map(formatData)
        .filter(item => item.VALOR_FINAL > 0 || item.DATA_EVENTO !== '')
      
      setData(prevData => [...prevData, ...newData])
      setHasMore(newData.length === 100)
    } catch (error) {
      console.error('Erro ao carregar mais dados:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Carregar mais dados quando chegar próximo ao fim
  useEffect(() => {
    const shouldLoadMore = currentPage * ITEMS_PER_PAGE >= data.length - ITEMS_PER_PAGE
    if (shouldLoadMore && hasMore && !loading && !loadingMore) {
      loadMoreData()
    }
  }, [currentPage, data.length, hasMore, loading, loadingMore])

  // Obter valores únicos para os filtros
  const uniqueMovementTypes = Array.from(new Set(data.map(item => item.TIPO_MOVIMENTO))).filter(Boolean)
  const uniqueYears = Array.from(new Set(data.map(item => item["ANO REFERENCIA"]))).filter(Boolean)
  const uniqueMonths = Array.from(new Set(data.map(item => item["MÊS REFERENCIA"]))).filter(Boolean)

  // Filtrar dados com validação adicional
  const filteredData = data.filter(item => {
    if (!item) return false

    const searchTermLower = searchTerm.toLowerCase()
    const nomeCliente = String(item.NOME_CLIENTE || '').toLowerCase()
    const documentoCliente = String(item.DOCUMENTO_CLIENTE || '')

    const matchesSearch = searchTerm === '' || 
      nomeCliente.includes(searchTermLower) || 
      documentoCliente.includes(searchTerm)

    const matchesType = selectedMovementType === 'all' || item.TIPO_MOVIMENTO === selectedMovementType
    const matchesYear = selectedYear === 'all' || item["ANO REFERENCIA"] === selectedYear
    const matchesMonth = selectedMonth === 'all' || item["MÊS REFERENCIA"] === selectedMonth

    return matchesSearch && matchesType && matchesYear && matchesMonth
  })

  // Paginação
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Métricas para os cards com validação
  const totalClientes = new Set(filteredData.filter(item => item.DOCUMENTO_CLIENTE).map(item => item.DOCUMENTO_CLIENTE)).size
  const clientesAVencer = filteredData.filter(item => item["DIAS EM ATRASO"] === "A VENCER").length
  const clientesEmAtraso = filteredData.filter(item => item["CONTAGEM TOTAL DIAS EM ATRASOS"] === 1).length

  // Métricas para os novos cards de faturas
  const dadosFaturasCards = agruparDadosPorFatura(filteredData)
  const fatura0Count = dadosFaturasCards.filter(item => (item.faturas['0'] || 0) > 0).length
  const fatura1Count = dadosFaturasCards.filter(item => (item.faturas['1'] || 0) > 0).length
  const fatura2Count = dadosFaturasCards.filter(item => (item.faturas['2'] || 0) > 0).length
  const fatura3Count = dadosFaturasCards.filter(item => (item.faturas['3'] || 0) > 0).length

  // Reset página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedMovementType, selectedYear, selectedMonth])

  // Dados agrupados para a tabela de faturas
  const dadosFaturas = agruparDadosPorFatura(filteredData)
    .filter(item => {
      // Verifica se pelo menos uma fatura tem valor diferente de 0
      return Object.values(item.faturas).some(valor => valor > 0)
    })
  const paginatedFaturas = dadosFaturas.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Função para download dos dados
  const downloadDados = () => {
    const dadosAgrupados = agruparDadosPorFatura(filteredData)
      .filter(item => Object.values(item.faturas).some(valor => valor > 0))
    
    // Criar CSV
    const headers = ['Documento', 'Nome do Cliente', 'Mês de Referência', 
                    'Fatura 0', 'Valor Fatura 0',
                    'Fatura 1', 'Valor Fatura 1',
                    'Fatura 2', 'Valor Fatura 2',
                    'Fatura 3', 'Valor Fatura 3']
    
    const csvData = dadosAgrupados.map(cliente => [
      cliente.DOCUMENTO_CLIENTE,
      cliente.NOME_CLIENTE,
      cliente["MÊS REFERENCIA"],
      '0', cliente.faturas['0'] || 0,
      '1', cliente.faturas['1'] || 0,
      '2', cliente.faturas['2'] || 0,
      '3', cliente.faturas['3'] || 0
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(';'))
      .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'clientes_faturas.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto text-center">
          <h1 className="text-2xl text-red-600">{error}</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-8">
        {/* Header com Logo */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[#005B9C]">Dashboard</h1>
          <img 
            src="/acl-telecom-logo.png" 
            alt="ACL Telecom" 
            className="h-16 object-contain"
          />
        </div>
        
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Select value={selectedMovementType} onValueChange={setSelectedMovementType}>
              <SelectTrigger className="border-gray-200">
                <SelectValue placeholder="Tipo de Movimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                {uniqueMovementTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="border-gray-200">
                <SelectValue placeholder="Ano de Referência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Anos</SelectItem>
                {uniqueYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="border-gray-200">
                <SelectValue placeholder="Mês de Referência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Meses</SelectItem>
                {uniqueMonths.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Seção de Cards - Contagem de Clientes */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#005B9C] mb-4">Contagem de Clientes</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-[#005B9C]">Total de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#005B9C]">{totalClientes}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-green-600">Faturas a Vencer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{clientesAVencer}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-red-600">Faturas em Atraso</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">{clientesEmAtraso}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seção de Cards - Contagem de Faturas */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#005B9C] mb-4">Contagem de Faturas</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-[#005B9C]">
              <CardHeader>
                <CardTitle className="text-[#005B9C]">Fatura 0</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#005B9C]">{fatura0Count}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-[#00A3E0]">
              <CardHeader>
                <CardTitle className="text-[#00A3E0]">Fatura 1</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#00A3E0]">{fatura1Count}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-[#00A3E0]">
              <CardHeader>
                <CardTitle className="text-[#00A3E0]">Fatura 2</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#00A3E0]">{fatura2Count}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-[#00A3E0]">
              <CardHeader>
                <CardTitle className="text-[#00A3E0]">Fatura 3</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#00A3E0]">{fatura3Count}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabelas */}
        <div className="space-y-8">
          {/* Barra de Busca e Download */}
          <div className="flex justify-between items-center">
            <Input
              placeholder="Buscar por nome ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm border-gray-200"
            />
            <Button
              onClick={downloadDados}
              className="flex items-center gap-2 bg-[#005B9C] hover:bg-[#00A3E0] transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>

          {/* Tabela de Clientes */}
          <div className="bg-white rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-[#005B9C]">CNPJ</TableHead>
                  <TableHead className="text-[#005B9C]">Nome do Cliente</TableHead>
                  <TableHead className="text-[#005B9C]">Tipo de Movimento</TableHead>
                  <TableHead className="text-[#005B9C]">Dias em Atraso</TableHead>
                  <TableHead className="text-[#005B9C]">Valor Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Carregando...</TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Nenhum resultado encontrado</TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.DOCUMENTO_CLIENTE}</TableCell>
                      <TableCell>{item.NOME_CLIENTE}</TableCell>
                      <TableCell>{item.TIPO_MOVIMENTO}</TableCell>
                      <TableCell>{item["DIAS EM ATRASO"] || "-"}</TableCell>
                      <TableCell>R$ {item.VALOR_FINAL.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Tabela de Faturas */}
          <div className="bg-white rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-[#005B9C]">CNPJ</TableHead>
                  <TableHead className="text-[#005B9C]">Nome do Cliente</TableHead>
                  <TableHead className="text-[#005B9C]">Mês Referência</TableHead>
                  <TableHead className="text-[#005B9C]">Fatura 0</TableHead>
                  <TableHead className="text-[#005B9C]">Fatura 1</TableHead>
                  <TableHead className="text-[#005B9C]">Fatura 2</TableHead>
                  <TableHead className="text-[#005B9C]">Fatura 3</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Carregando...</TableCell>
                  </TableRow>
                ) : paginatedFaturas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Nenhum resultado encontrado</TableCell>
                  </TableRow>
                ) : (
                  paginatedFaturas.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.DOCUMENTO_CLIENTE}</TableCell>
                      <TableCell>{item.NOME_CLIENTE}</TableCell>
                      <TableCell>{item["MÊS REFERENCIA"]}</TableCell>
                      <TableCell>R$ {(item.faturas['0'] || 0).toFixed(2)}</TableCell>
                      <TableCell>R$ {(item.faturas['1'] || 0).toFixed(2)}</TableCell>
                      <TableCell>R$ {(item.faturas['2'] || 0).toFixed(2)}</TableCell>
                      <TableCell>R$ {(item.faturas['3'] || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {!loading && filteredData.length > 0 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">
                Mostrando {startIndex + 1} até {Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length} resultados
                {loadingMore && " (Carregando mais...)"}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-[#005B9C] text-[#005B9C] hover:bg-[#005B9C] hover:text-white"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loadingMore}
                  className="border-[#005B9C] text-[#005B9C] hover:bg-[#005B9C] hover:text-white"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App