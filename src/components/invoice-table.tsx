import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface InvoiceData {
  DOCUMENTO_CLIENTE: number;
  NOME_CLIENTE: string;
  FATURA: string;
  VALOR_FINAL: number;
}

interface InvoiceTableProps {
  data: InvoiceData[];
}

export function InvoiceTable({ data }: InvoiceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Process data to group by client
  const clientInvoices = data.reduce((acc, curr) => {
    const key = curr.DOCUMENTO_CLIENTE;
    if (!acc[key]) {
      acc[key] = {
        documento: curr.DOCUMENTO_CLIENTE,
        nome: curr.NOME_CLIENTE,
        faturas: {
          0: 0,
          1: 0,
          2: 0,
          3: 0
        }
      };
    }
    
    const faturaNum = parseInt(curr.FATURA);
    if (faturaNum >= 0 && faturaNum <= 3) {
      acc[key].faturas[faturaNum] = curr.VALOR_FINAL;
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Filter based on search
  const filteredClients = Object.values(clientInvoices).filter(client => 
    client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.documento.toString().includes(searchTerm)
  );

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filtrar por nome ou CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CNPJ</TableHead>
              <TableHead>Nome do Cliente</TableHead>
              <TableHead>Fatura 0</TableHead>
              <TableHead>Fatura 1</TableHead>
              <TableHead>Fatura 2</TableHead>
              <TableHead>Fatura 3</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.documento}>
                <TableCell className="font-mono">{client.documento}</TableCell>
                <TableCell>{client.nome}</TableCell>
                <TableCell>R$ {client.faturas[0].toFixed(2)}</TableCell>
                <TableCell>R$ {client.faturas[1].toFixed(2)}</TableCell>
                <TableCell>R$ {client.faturas[2].toFixed(2)}</TableCell>
                <TableCell>R$ {client.faturas[3].toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}