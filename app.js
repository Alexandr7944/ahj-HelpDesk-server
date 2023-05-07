const fs = require('fs');
const http = require('http');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const cors = require('@koa/cors');
const data = require('./data.json');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = new Koa();
app.use(koaBody());

const tickets = data;

const updataJSON = () => {
  // fs.writeFile('./data.json', JSON.stringify(tickets), (err) => {
  //   if (err) {
  //     console.error(err)
  //     return
  //   }
  //   console.log('файл записан успешно');
  // })

  try {
    fs.writeFileSync('./data.json', JSON.stringify(tickets))
    console.log('файл записан успешно', data);
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

      console.log(ctx.request.query);
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
      const createTicket = {
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

      ctx.response.body = createTicket;
      updataJSON();
      return;

    case 'deleteTicket':
      const id = JSON.parse(ctx.request.body);
      tickets.ticketFull = tickets.ticketFull.filter((item) => item.id !== id);
      tickets.ticket = tickets.ticket.filter((item) => item.id !== id);
      ctx.response.status = 200;
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

  const ticketFull = JSON.parse(ctx.request.body);
  const ticket = {...ticketFull};
  delete ticket.description;

  ticketFull.description && 
    tickets.ticketFull.forEach((item) => {
      if (item.id !== ticketFull.id) return;
      item = ticketFull;
    });

  tickets.ticket.forEach((item) => {
    if (item.id !== ticket.id) return;
    item = ticket;
    ctx.body = JSON.stringify({"success": true});
  });
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