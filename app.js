const fs = require('fs');
const http = require('http');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const cors = require('@koa/cors');
const data = require('./data.json');
const { v4: uuidv4 } = require('uuid');

const app = new Koa();
app.use(koaBody());

const tickets = data;

const updataJSON = () => {
  try {
    fs.writeFileSync('./data.json', JSON.stringify(tickets))
    console.log('файл записан успешно');
  } catch (err) {
    console.error(err)
  }
}

app.use(cors());

app.use(async (ctx, next) => {
  if (ctx.request.method !== 'GET') {
    next();

    return;
  }

  const { method } = ctx.request.query;
  
  switch (method) {
    case 'allTickets':
      ctx.response.body = tickets.ticket || [];
      return;
    case 'ticketById':
      const { id } = ctx.request.query;
      const resp = tickets.ticketFull.filter((ticket) => ticket.id === id);

      resp.length
        ? ctx.response.body = resp
        : ctx.response.body = [{message: 'Задача по вашему запросу отсутствует'}];
      return;
    default:
      ctx.response.status = 404;
      return;
  }
});

app.use(async (ctx, next) => {
  if (ctx.request.method !== 'POST') {
    next();

    return;
  }
  
  const { method } = ctx.request.query;
  
  switch (method) {
    case 'createTicket':
      const { name, description } = JSON.parse(ctx.request.body);
      let createTicket = {
        id: uuidv4(),
        name,
        status: false,
        created: Date.now() + ''
      }
      tickets.ticket.push({...createTicket});

      if (description) {
        createTicket = {...createTicket, description};
        tickets.ticketFull.push(createTicket);
      }
      
      ctx.body = JSON.stringify(createTicket);
      updataJSON();
      return;

    case 'deleteTicket':
      const id = JSON.parse(ctx.request.body);
      tickets.ticketFull = tickets.ticketFull.filter((item) => item.id !== id);
      tickets.ticket = tickets.ticket.filter((item) => item.id !== id);
      
      ctx.body = JSON.stringify({success: true});
      updataJSON();
      return;

    default:
      ctx.response.status = 404;
      return;
  }
});

app.use(async (ctx, next) => {
  if (ctx.request.method !== 'PUT') {
    next();

    return;
  }

  const {id} = ctx.request.query;
  const ticketFull = JSON.parse(ctx.request.body);
  const ticket = {...ticketFull};
  delete ticket.description;

  ticketFull.description && 
    tickets.ticketFull.forEach((item, index) => {
      if (item.id !== id) return;
      tickets.ticketFull[index] = ticketFull;
    });

  tickets.ticket.forEach((item, index) => {
    if (item.id !== ticket.id) return;
    tickets.ticket[index] = ticket;
  });
  
  ctx.body = JSON.stringify({"success": true});
  updataJSON();
});

const server = http.createServer(app.callback());

const port = 7071;

server.listen(port, (err) => {
  if(err) {
    console.log(err);
    return;
  }
  console.log('Server is listening to ' + port);
});